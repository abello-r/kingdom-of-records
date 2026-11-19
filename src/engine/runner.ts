import type { Database, SqlJsStatic } from 'sql.js';
import type { ResultSet, SqlValue, StatementOutcome, TableSnapshot } from './types';

/** Fresh in-memory database with the level schema and seed data. */
export function createDatabase(SQL: SqlJsStatic, setup: string): Database {
  const db = new SQL.Database();
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(setup);
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}

export interface RunOutput {
  statements: StatementOutcome[];
  /** Raw SQLite error message if a statement failed; earlier statements stay applied. */
  error?: string;
}

/**
 * Runs every statement of `sql` in order.
 * Unlike `db.exec`, SELECTs that return zero rows still produce a result set with their columns.
 */
export function runSql(db: Database, sql: string): RunOutput {
  const statements: StatementOutcome[] = [];
  try {
    for (const stmt of db.iterateStatements(sql)) {
      try {
        const columns = stmt.getColumnNames();
        const text = stmt.getSQL().trim();
        if (columns.length > 0) {
          const rows: SqlValue[][] = [];
          while (stmt.step()) rows.push(stmt.get());
          statements.push({ kind: 'rows', sql: text, result: { columns, rows } });
        } else {
          // getRowsModified() is not reset by DDL statements, so measure total_changes() instead.
          const before = totalChanges(db);
          stmt.step();
          statements.push({ kind: 'changes', sql: text, changes: totalChanges(db) - before });
        }
      } finally {
        stmt.free();
      }
    }
  } catch (error) {
    return { statements, error: error instanceof Error ? error.message : String(error) };
  }
  return { statements };
}

function totalChanges(db: Database): number {
  return Number(db.exec('SELECT total_changes()')[0]?.values[0]?.[0] ?? 0);
}

/** Last result set produced by the statements, if any. */
export function lastResult(statements: StatementOutcome[]): ResultSet | undefined {
  for (let i = statements.length - 1; i >= 0; i--) {
    const s = statements[i]!;
    if (s.kind === 'rows') return s.result;
  }
  return undefined;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** User tables in the database (excluding SQLite internals), in creation order. */
export function listTables(db: Database): string[] {
  const res = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid",
  );
  return (res[0]?.values ?? []).map((row) => String(row[0]));
}

/** Content of one table, or `null` when it does not exist (names are case-insensitive, as in SQLite). */
export function snapshotTable(db: Database, name: string): TableSnapshot | null {
  const actual = listTables(db).find((t) => t.toLowerCase() === name.toLowerCase());
  if (!actual) return null;
  const stmt = db.prepare(`SELECT * FROM ${quoteIdent(actual)}`);
  try {
    const columns = stmt.getColumnNames();
    const rows: SqlValue[][] = [];
    while (stmt.step()) rows.push(stmt.get());
    return { name: actual, columns, rows };
  } finally {
    stmt.free();
  }
}

export interface SchemaTable {
  name: string;
  columns: { name: string; type: string }[];
}

/** Tables and columns, used for editor autocompletion and the schema panel. */
export function describeSchema(db: Database): SchemaTable[] {
  return listTables(db).map((name) => {
    const info = db.exec(`PRAGMA table_info(${quoteIdent(name)})`);
    const columns = (info[0]?.values ?? []).map((row) => ({
      name: String(row[1]),
      type: String(row[2] ?? ''),
    }));
    return { name, columns };
  });
}
