import type { Mismatch, ResultSet, SqlValue, TableSnapshot } from './types';

/** Canonical form of a value so equal values produce equal keys (12 significant digits for numbers). */
export function canonicalValue(value: SqlValue): string {
  if (value === null) return 'null';
  if (typeof value === 'number') return `n:${Number(value.toPrecision(12))}`;
  if (typeof value === 'string') return `s:${value}`;
  return `b:${Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function rowKey(row: SqlValue[]): string {
  return JSON.stringify(row.map(canonicalValue));
}

/** Column name as players may write it: case, spaces and quoting do not matter. */
export function normalizeColumnName(name: string): string {
  return name.toLowerCase().replace(/[\s"`[\]]/g, '');
}

/** Counts rows present in one multiset but not in the other. */
function multisetDiff(expected: SqlValue[][], actual: SqlValue[][]): { missing: number; unexpected: number } {
  const counts = new Map<string, number>();
  for (const row of expected) {
    const k = rowKey(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let unexpected = 0;
  for (const row of actual) {
    const k = rowKey(row);
    const c = counts.get(k) ?? 0;
    if (c > 0) counts.set(k, c - 1);
    else unexpected++;
  }
  let missing = 0;
  counts.forEach((c) => (missing += c));
  return { missing, unexpected };
}

/**
 * Returns the player's rows with columns reordered to match the expected ones when the column names
 * are the same set (so `SELECT role, name` is accepted for `SELECT name, role`), or null when names
 * do not match.
 */
function alignColumns(expected: string[], actual: string[], actualRows: SqlValue[][]): SqlValue[][] | null {
  const exp = expected.map(normalizeColumnName);
  const act = actual.map(normalizeColumnName);
  if (exp.join('\u0000') === act.join('\u0000')) return actualRows;
  const unique = new Set(exp).size === exp.length && new Set(act).size === act.length;
  if (!unique || exp.some((name) => !act.includes(name))) return null;
  const order = exp.map((name) => act.indexOf(name));
  return actualRows.map((row) => order.map((i) => row[i] ?? null));
}

export interface CompareOptions {
  orderMatters?: boolean;
  ignoreColumnNames?: boolean;
}

/** Compares the player's result set with the expected one. Returns `null` when they match. */
export function compareResults(
  expected: ResultSet,
  actual: ResultSet | undefined,
  options: CompareOptions = {},
): Mismatch | null {
  if (!actual) return { reason: 'noResult' };
  if (actual.columns.length !== expected.columns.length) {
    return { reason: 'columnCount', expected: expected.columns.length, actual: actual.columns.length };
  }

  let rows = actual.rows;
  if (!options.ignoreColumnNames) {
    const aligned = alignColumns(expected.columns, actual.columns, actual.rows);
    if (!aligned) return { reason: 'columnNames', expected: expected.columns, actual: actual.columns };
    rows = aligned;
  }

  const diff = multisetDiff(expected.rows, rows);
  if (diff.missing > 0 || diff.unexpected > 0) {
    if (rows.length !== expected.rows.length) {
      return { reason: 'rowCount', expected: expected.rows.length, actual: rows.length };
    }
    return { reason: 'rows', ...diff };
  }

  if (options.orderMatters && expected.rows.some((row, i) => rowKey(row) !== rowKey(rows[i]!))) {
    return { reason: 'order' };
  }
  return null;
}

/** Compares final table contents (row order ignored). Returns the first difference, or `null`. */
export function compareTables(
  tables: string[],
  expected: (TableSnapshot | null)[],
  actual: (TableSnapshot | null)[],
): Mismatch | null {
  for (let i = 0; i < tables.length; i++) {
    const exp = expected[i];
    const act = actual[i];
    const table = tables[i]!;
    if (!exp) throw new Error(`Solution state has no table "${table}"`);
    if (!act) return { reason: 'missingTable', table };
    const sameColumns =
      exp.columns.map(normalizeColumnName).join(',') === act.columns.map(normalizeColumnName).join(',');
    if (!sameColumns) return { reason: 'tableColumns', table };
    const diff = multisetDiff(exp.rows, act.rows);
    if (diff.missing > 0 || diff.unexpected > 0) return { reason: 'tableRows', table, ...diff };
  }
  return null;
}
