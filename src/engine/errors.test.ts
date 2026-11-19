import { beforeAll, describe, expect, it } from 'vitest';
import type { SqlJsStatic } from 'sql.js';
import { loadSqlEngine } from '../db/engine';
import { describeSqlError, suggestKeyword } from './errors';
import { createDatabase, runSql } from './runner';

const SETUP = `
CREATE TABLE houses (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE villagers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, role TEXT CHECK (role <> ''),
  house_id INTEGER REFERENCES houses(id)
);
INSERT INTO houses VALUES (1, 'Mill');
INSERT INTO villagers VALUES (1, 'Pip', 'pawn', 1);
`;
const KNOWN = ['id', 'name', 'role', 'house_id'];

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await loadSqlEngine();
});

/** Runs the SQL against real SQLite so the patterns are checked against genuine messages. */
function errorFor(sql: string) {
  const db = createDatabase(SQL, SETUP);
  try {
    const run = runSql(db, sql);
    if (!run.error) throw new Error(`Expected an error for: ${sql}`);
    return describeSqlError(run.error, { knownColumns: KNOWN });
  } finally {
    db.close();
  }
}

describe('describeSqlError with real SQLite messages', () => {
  it.each([
    ['SELECT * FROM villager', 'noSuchTable', { table: 'villager' }],
    ['SELECT nme FROM villagers', 'noSuchColumn', { column: 'nme' }],
    ['SELEC * FROM villagers', 'syntaxNear', { token: 'SELEC' }],
    ['SELECT * FROM villagers WHERE', 'incomplete', {}],
    ["SELECT 'abc FROM villagers", 'unrecognizedToken', { token: "'abc FROM villagers" }],
    ['SELECT id FROM villagers, houses', 'ambiguousColumn', { column: 'id' }],
    ['SELECT name FROM villagers WHERE COUNT(*) > 1', 'aggregateMisuse', { fn: 'COUNT' }],
    ["INSERT INTO villagers VALUES (2, 'Pip', 'pawn', 1)", 'unique', { column: 'villagers.name' }],
    ["INSERT INTO villagers (id, role) VALUES (3, 'x')", 'notNull', { column: 'villagers.name' }],
    ["INSERT INTO villagers VALUES (7, 'D', '', 1)", 'check', {}],
    ["INSERT INTO villagers VALUES (6, 'C', 'pawn', 99)", 'foreignKey', {}],
    ["INSERT INTO villagers VALUES (4, 'Ann')", 'valuesForTable', { table: 'villagers', columns: '4', values: '2' }],
    ["INSERT INTO villagers (id, name) VALUES (5, 'B', 'c')", 'valuesForColumns', { values: '3', columns: '2' }],
    ['SELECT SUM() FROM villagers', 'functionArgs', { fn: 'SUM' }],
    ['SELECT FOO(name) FROM villagers', 'noSuchFunction', { fn: 'FOO' }],
    ['SELECT * FROM villagers WHERE id IN (SELECT id, name FROM houses)', 'subqueryColumns', { count: '2' }],
    ['SELECT * FROM villagers WHERE id = (SELECT id, name FROM houses)', 'rowValueMisused', {}],
    ['CREATE TABLE houses (x)', 'tableExists', { table: 'houses' }],
    ['SELECT *', 'noTables', {}],
  ])('%s → %s', (sql, key, params) => {
    const info = errorFor(sql);
    expect(info.key).toBe(key);
    expect(info.params).toEqual(params);
    expect(info.raw).not.toBe('');
  });

  it('suggests the keyword for typos', () => {
    expect(errorFor('SELEC * FROM villagers').tip).toEqual({ key: 'didYouMean', params: { keyword: 'SELECT' } });
    expect(errorFor('SELECT * FORM villagers').tip).toEqual({ key: 'didYouMean', params: { keyword: 'FROM' } });
  });

  it('suggests quotes when an unknown "column" is probably a text value', () => {
    const info = errorFor('SELECT name FROM villagers WHERE role = pawn');
    expect(info.key).toBe('noSuchColumn');
    expect(info.tip).toEqual({ key: 'quoteText', params: { value: 'pawn' } });
  });

  it('does not suggest quotes for qualified column names', () => {
    expect(errorFor('SELECT v.house FROM villagers v').tip).toBeUndefined();
  });

  it('suggests closing an unterminated text', () => {
    expect(errorFor("SELECT * FROM villagers WHERE name = 'Pip").tip?.key).toBe('closeQuote');
  });

  it('falls back to a generic message', () => {
    expect(describeSqlError('something unexpected')).toEqual({
      key: 'generic',
      params: { message: 'something unexpected' },
      raw: 'something unexpected',
    });
  });
});

describe('suggestKeyword', () => {
  it('finds close keywords only', () => {
    expect(suggestKeyword('WEHRE')).toBe('WHERE');
    expect(suggestKeyword('gruop')).toBe('GROUP');
    expect(suggestKeyword('SELECT')).toBeUndefined();
    expect(suggestKeyword('villagers')).toBeUndefined();
    expect(suggestKeyword('x')).toBeUndefined();
  });
});
