import { beforeAll, describe, expect, it } from 'vitest';
import type { SqlJsStatic } from 'sql.js';
import { loadSqlEngine } from '../db/engine';
import { createDatabase, describeSchema, runSql } from './runner';
import { makeLevel } from './test-fixtures';
import { isEffectivelyEmpty, validateAttempt } from './validate';

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await loadSqlEngine();
});

describe('validateAttempt — result levels', () => {
  const level = makeLevel();

  it('accepts the solution and equivalent queries', () => {
    expect(validateAttempt(SQL, level, level.solution).correct).toBe(true);
    expect(validateAttempt(SQL, level, "select role, name from villagers where role in ('archer')").correct).toBe(true);
    expect(validateAttempt(SQL, level, "SELECT name, role FROM villagers WHERE role = 'archer' ORDER BY age DESC").correct).toBe(true);
  });

  it('explains wrong answers', () => {
    expect(validateAttempt(SQL, level, 'SELECT name, role FROM villagers').mismatch).toEqual({
      reason: 'rowCount',
      expected: 2,
      actual: 5,
    });
    expect(validateAttempt(SQL, level, "SELECT * FROM villagers WHERE role = 'archer'").mismatch).toEqual({
      reason: 'columnCount',
      expected: 2,
      actual: 4,
    });
  });

  it('uses the last result set when several statements run', () => {
    const sql = "SELECT * FROM villagers; SELECT name, role FROM villagers WHERE role = 'archer';";
    const result = validateAttempt(SQL, level, sql);
    expect(result.correct).toBe(true);
    expect(result.statements).toHaveLength(2);
  });

  it('keeps the columns of a SELECT that returns no rows', () => {
    const result = validateAttempt(SQL, level, "SELECT name, role FROM villagers WHERE role = 'king'");
    expect(result.statements[0]).toMatchObject({ kind: 'rows', result: { columns: ['name', 'role'], rows: [] } });
    expect(result.mismatch).toEqual({ reason: 'rowCount', expected: 2, actual: 0 });
  });

  it('reports a friendly SQL error and keeps earlier statements', () => {
    const result = validateAttempt(SQL, level, "SELECT name FROM villagers; SELECT * FROM villager");
    expect(result.correct).toBe(false);
    expect(result.error).toMatchObject({ key: 'noSuchTable', params: { table: 'villager' } });
    expect(result.statements).toHaveLength(1);
  });

  it('suggests quotes for unquoted text using the level schema', () => {
    const result = validateAttempt(SQL, level, 'SELECT name, role FROM villagers WHERE role = archer');
    expect(result.error?.tip).toEqual({ key: 'quoteText', params: { value: 'archer' } });
  });

  it('accepts double-quoted text but adds a gentle notice', () => {
    const result = validateAttempt(SQL, level, 'SELECT "name", role FROM villagers WHERE role = "archer"');
    expect(result.correct).toBe(true);
    expect(result.notices).toEqual([{ key: 'doubleQuotes', params: { value: 'archer' } }]);
    expect(validateAttempt(SQL, level, level.solution).notices).toBeUndefined();
  });

  it('rejects empty attempts without running them', () => {
    expect(validateAttempt(SQL, level, '  -- just a comment\n ; /* nothing */ ').error?.key).toBe('empty');
  });

  it('checks order only when the level requires it', () => {
    const ordered = makeLevel({
      solution: "SELECT name FROM villagers WHERE role = 'archer' ORDER BY age DESC",
      check: { mode: 'result', orderMatters: true },
    });
    expect(validateAttempt(SQL, ordered, ordered.solution).correct).toBe(true);
    expect(validateAttempt(SQL, ordered, "SELECT name FROM villagers WHERE role = 'archer' ORDER BY age").mismatch).toEqual({
      reason: 'order',
    });
  });

  it('accepts any column names when the level ignores them', () => {
    const agg = makeLevel({ solution: 'SELECT SUM(age) FROM villagers', check: { mode: 'result', ignoreColumnNames: true } });
    expect(validateAttempt(SQL, agg, 'SELECT sum( age ) AS total FROM villagers').correct).toBe(true);
  });

  it('starts every attempt from the original data', () => {
    validateAttempt(SQL, level, "DELETE FROM villagers WHERE role = 'archer'");
    expect(validateAttempt(SQL, level, level.solution).correct).toBe(true);
  });
});

describe('validateAttempt — state levels', () => {
  const level = makeLevel({
    solution: "INSERT INTO villagers (name, role, age) VALUES ('Corvin', 'monk', 50); UPDATE houses SET status = 'rebuilt' WHERE owner = 'Pip';",
    check: { mode: 'state', tables: ['villagers', 'houses'] },
  });

  it('accepts the solution and returns the final tables', () => {
    const result = validateAttempt(SQL, level, level.solution);
    expect(result.correct).toBe(true);
    expect(result.tables?.map((t) => t.name)).toEqual(['villagers', 'houses']);
    expect(result.statements).toMatchObject([
      { kind: 'changes', changes: 1 },
      { kind: 'changes', changes: 1 },
    ]);
  });

  it('accepts the same final state reached another way', () => {
    const sql = "UPDATE houses SET status = 'rebuilt' WHERE id = 1; INSERT INTO villagers VALUES (6, 'Corvin', 'monk', 50);";
    expect(validateAttempt(SQL, level, sql).correct).toBe(true);
  });

  it('reports which table is wrong', () => {
    const sql = "INSERT INTO villagers (name, role, age) VALUES ('Corvin', 'monk', 50); UPDATE houses SET status = 'rebuilt';";
    expect(validateAttempt(SQL, level, sql).mismatch).toEqual({ reason: 'tableRows', table: 'houses', missing: 2, unexpected: 2 });
  });

  it('reports a dropped table', () => {
    const sql = `${level.solution} DROP TABLE houses;`;
    expect(validateAttempt(SQL, level, sql).mismatch).toEqual({ reason: 'missingTable', table: 'houses' });
  });
});

describe('validateAttempt — hidden data variants', () => {
  const variant = `
CREATE TABLE villagers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, age INTEGER);
INSERT INTO villagers (name, role, age) VALUES ('Rosa', 'archer', 22), ('Tobin', 'pawn', 40), ('Ivo', 'archer', 27);
CREATE TABLE houses (id INTEGER PRIMARY KEY, owner TEXT, status TEXT);
INSERT INTO houses (owner, status) VALUES ('Rosa', 'burnt'), ('Tobin', 'burnt'), ('Ivo', 'burnt'), ('Pip', 'rebuilding');`;

  it('accepts honest queries on every data set', () => {
    const level = makeLevel({ variants: [variant] });
    expect(validateAttempt(SQL, level, "SELECT name, role FROM villagers WHERE role = 'archer'").correct).toBe(true);
  });

  it('rejects answers that copy values from the visible results', () => {
    const level = makeLevel({ variants: [variant] });
    const hardcoded = "SELECT name, role FROM villagers WHERE name IN ('Wren', 'Bram')";
    const result = validateAttempt(SQL, level, hardcoded);
    expect(result.correct).toBe(false);
    expect(result.mismatch).toEqual({ reason: 'hiddenData' });
    // The player still sees the (correct-looking) result of the visible data.
    expect(result.statements[0]).toMatchObject({ kind: 'rows', result: { rows: [['Wren', 'archer'], ['Bram', 'archer']] } });
  });

  it('reports the visible mismatch first when the answer is already wrong', () => {
    const level = makeLevel({ variants: [variant] });
    expect(validateAttempt(SQL, level, 'SELECT name, role FROM villagers').mismatch?.reason).toBe('rowCount');
  });

  it('applies to state levels too', () => {
    const level = makeLevel({
      solution: "UPDATE houses SET status = 'rebuilt' WHERE owner = 'Pip'",
      check: { mode: 'state', tables: ['houses'] },
      variants: [variant],
    });
    expect(validateAttempt(SQL, level, "UPDATE houses SET status = 'rebuilt' WHERE owner = 'Pip'").correct).toBe(true);
    expect(validateAttempt(SQL, level, "UPDATE houses SET status = 'rebuilt' WHERE id = 1").mismatch).toEqual({
      reason: 'hiddenData',
    });
  });
});

describe('runner helpers', () => {
  it('counts changes per statement, not including DDL', () => {
    const db = createDatabase(SQL, 'CREATE TABLE t (x)');
    const run = runSql(db, 'INSERT INTO t VALUES (1), (2); CREATE TABLE u (y); UPDATE t SET x = 3 WHERE x = 1;');
    expect(run.statements.map((s) => (s.kind === 'changes' ? s.changes : -1))).toEqual([2, 0, 1]);
    db.close();
  });

  it('describes the schema for autocompletion', () => {
    const db = createDatabase(SQL, makeLevel().setup);
    expect(describeSchema(db)).toEqual([
      {
        name: 'villagers',
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'name', type: 'TEXT' },
          { name: 'role', type: 'TEXT' },
          { name: 'age', type: 'INTEGER' },
        ],
      },
      { name: 'houses', columns: [{ name: 'id', type: 'INTEGER' }, { name: 'owner', type: 'TEXT' }, { name: 'status', type: 'TEXT' }] },
    ]);
    db.close();
  });

  it('detects effectively empty SQL', () => {
    expect(isEffectivelyEmpty(';;\n -- note\n/* block */')).toBe(true);
    expect(isEffectivelyEmpty('SELECT 1')).toBe(false);
  });
});
