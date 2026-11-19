import type { Database, SqlJsStatic } from 'sql.js';
import { compareResults, compareTables } from './compare';
import { describeSqlError, emptyQueryError } from './errors';
import { doubleQuotedValues } from './lint';
import { createDatabase, describeSchema, lastResult, runSql, snapshotTable, type RunOutput } from './runner';
import type { AttemptResult, Level, Mismatch, Notice, ResultSet, TableSnapshot } from './types';

/** True when the SQL has nothing to execute (only whitespace, comments or semicolons). */
export function isEffectivelyEmpty(sql: string): boolean {
  const stripped = sql
    .replace(/\/\*[\s\S]*?(\*\/|$)/g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/[;\s]/g, '');
  return stripped.length === 0;
}

export type Expected = { mode: 'result'; result: ResultSet } | { mode: 'state'; tables: (TableSnapshot | null)[] };

const expectedCache = new WeakMap<Level, Map<string, Expected>>();

/**
 * Runs the reference solution on a data set (the visible setup by default, or a hidden variant).
 * Cached per level and data set. A failing solution is a bug in the level file.
 */
export function expectedFor(SQL: SqlJsStatic, level: Level, setup: string = level.setup): Expected {
  let perSetup = expectedCache.get(level);
  if (!perSetup) expectedCache.set(level, (perSetup = new Map()));
  const cached = perSetup.get(setup);
  if (cached) return cached;

  const db = createDatabase(SQL, setup);
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
    perSetup.set(setup, expected);
    return expected;
  } finally {
    db.close();
  }
}

/** Compares a finished run with the expected outcome for the same data set. */
function compareRun(level: Level, expected: Expected, db: Database, run: RunOutput): Mismatch | null {
  if (expected.mode === 'result' && level.check.mode === 'result') {
    return compareResults(expected.result, lastResult(run.statements), {
      orderMatters: level.check.orderMatters,
      ignoreColumnNames: level.check.ignoreColumnNames,
    });
  }
  if (expected.mode === 'state' && level.check.mode === 'state') {
    const actual = level.check.tables.map((t) => snapshotTable(db, t));
    return compareTables(level.check.tables, expected.tables, actual);
  }
  throw new Error(`Level ${level.id}: check mode mismatch`);
}

/** True when the attempt also gives the expected outcome on a hidden data set. */
function passesVariant(SQL: SqlJsStatic, level: Level, setup: string, playerSql: string): boolean {
  const expected = expectedFor(SQL, level, setup);
  const db = createDatabase(SQL, setup);
  try {
    const run = runSql(db, playerSql);
    return !run.error && compareRun(level, expected, db, run) === null;
  } finally {
    db.close();
  }
}

/**
 * Checks a player's attempt. The database is rebuilt from the level setup on every attempt, so the
 * player's SQL always starts from the same data and results are reproducible. An attempt that is right
 * on the visible data must also be right on every hidden variant.
 */
export function validateAttempt(SQL: SqlJsStatic, level: Level, playerSql: string): AttemptResult {
  if (isEffectivelyEmpty(playerSql)) {
    return { correct: false, error: emptyQueryError(), statements: [] };
  }

  const expected = expectedFor(SQL, level);
  const db = createDatabase(SQL, level.setup);
  try {
    const schema = describeSchema(db);
    const knownColumns = schema.flatMap((t) => t.columns.map((c) => c.name.toLowerCase()));
    const quoted = doubleQuotedValues(playerSql, [...schema.map((t) => t.name), ...knownColumns]);
    const notices: Notice[] = quoted.map((value) => ({ key: 'doubleQuotes', params: { value } }));
    const run = runSql(db, playerSql);
    const tables =
      level.check.mode === 'state'
        ? level.check.tables.map((t) => snapshotTable(db, t)).filter((t): t is TableSnapshot => t !== null)
        : undefined;
    const base = { statements: run.statements, ...(tables && { tables }), ...(notices.length > 0 && { notices }) };

    if (run.error) {
      return { correct: false, error: describeSqlError(run.error, { knownColumns }), ...base };
    }

    let mismatch = compareRun(level, expected, db, run);
    if (!mismatch && level.variants?.some((setup) => !passesVariant(SQL, level, setup, playerSql))) {
      mismatch = { reason: 'hiddenData' };
    }
    return { correct: !mismatch, ...(mismatch && { mismatch }), ...base };
  } finally {
    db.close();
  }
}
