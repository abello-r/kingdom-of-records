import type { SqlJsStatic } from 'sql.js';
import { compareResults, compareTables } from './compare';
import { describeSqlError, emptyQueryError } from './errors';
import { createDatabase, describeSchema, lastResult, runSql, snapshotTable } from './runner';
import type { AttemptResult, Level, ResultSet, TableSnapshot } from './types';

/** True when the SQL has nothing to execute (only whitespace, comments or semicolons). */
export function isEffectivelyEmpty(sql: string): boolean {
  const stripped = sql
    .replace(/\/\*[\s\S]*?(\*\/|$)/g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/[;\s]/g, '');
  return stripped.length === 0;
}

type Expected = { mode: 'result'; result: ResultSet } | { mode: 'state'; tables: (TableSnapshot | null)[] };

const expectedCache = new WeakMap<Level, Expected>();

/** Runs the reference solution once per level. A failing solution is a bug in the level file. */
export function expectedFor(SQL: SqlJsStatic, level: Level): Expected {
  const cached = expectedCache.get(level);
  if (cached) return cached;

  const db = createDatabase(SQL, level.setup);
  try {
    const run = runSql(db, level.solution);
    if (run.error) throw new Error(`Level ${level.id}: solution fails: ${run.error}`);
    let expected: Expected;
    if (level.check.mode === 'result') {
      const result = lastResult(run.statements);
      if (!result) throw new Error(`Level ${level.id}: solution returns no result set`);
      expected = { mode: 'result', result };
    } else {
      expected = { mode: 'state', tables: level.check.tables.map((t) => snapshotTable(db, t)) };
    }
    expectedCache.set(level, expected);
    return expected;
  } finally {
    db.close();
  }
}

/**
 * Checks a player's attempt. The database is rebuilt from the level setup on every attempt, so the
 * player's SQL always starts from the same data and results are reproducible.
 */
export function validateAttempt(SQL: SqlJsStatic, level: Level, playerSql: string): AttemptResult {
  if (isEffectivelyEmpty(playerSql)) {
    return { correct: false, error: emptyQueryError(), statements: [] };
  }

  const expected = expectedFor(SQL, level);
  const db = createDatabase(SQL, level.setup);
  try {
    const knownColumns = describeSchema(db).flatMap((t) => t.columns.map((c) => c.name.toLowerCase()));
    const run = runSql(db, playerSql);
    const tables =
      level.check.mode === 'state'
        ? level.check.tables.map((t) => snapshotTable(db, t)).filter((t): t is TableSnapshot => t !== null)
        : undefined;

    if (run.error) {
      return {
        correct: false,
        error: describeSqlError(run.error, { knownColumns }),
        statements: run.statements,
        ...(tables && { tables }),
      };
    }

    let mismatch;
    if (expected.mode === 'result' && level.check.mode === 'result') {
      mismatch = compareResults(expected.result, lastResult(run.statements), {
        orderMatters: level.check.orderMatters,
        ignoreColumnNames: level.check.ignoreColumnNames,
      });
    } else if (expected.mode === 'state' && level.check.mode === 'state') {
      const actual = level.check.tables.map((t) => snapshotTable(db, t));
      mismatch = compareTables(level.check.tables, expected.tables, actual);
    }

    return {
      correct: !mismatch,
      ...(mismatch && { mismatch }),
      statements: run.statements,
      ...(tables && { tables }),
    };
  } finally {
    db.close();
  }
}
