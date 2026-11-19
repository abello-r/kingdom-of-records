import type { SqlErrorInfo } from './types';

/** SQL keywords players type; used to suggest a fix for typos such as `SELEC` or `FORM`. */
const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'ORDER', 'BY',
  'ASC', 'DESC', 'LIMIT', 'GROUP', 'HAVING', 'DISTINCT', 'AS', 'JOIN', 'LEFT', 'INNER', 'ON',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
];

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

/** Closest candidate to a misspelt word (case-insensitive, distance ≤ 2, never the word itself). */
function closest(word: string, candidates: readonly string[]): string | undefined {
  const w = word.toLowerCase();
  if (w.length < 3 || candidates.some((c) => c.toLowerCase() === w)) return undefined;
  let best: string | undefined;
  let bestDistance = 3;
  for (const c of candidates) {
    const d = levenshtein(w, c.toLowerCase());
    if (d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return best;
}

/** Closest keyword to a misspelt token, e.g. `SELEC` → `SELECT`. */
export function suggestKeyword(token: string): string | undefined {
  return closest(token, KEYWORDS);
}

interface Rule {
  pattern: RegExp;
  key: string;
  params?: (m: RegExpMatchArray) => Record<string, string>;
}

/** Order matters: the first matching rule wins. Messages come from SQLite (checked in errors.test.ts). */
const RULES: Rule[] = [
  { pattern: /^no such table: (.+)$/, key: 'noSuchTable', params: (m) => ({ table: m[1]! }) },
  { pattern: /^no such column: (.+)$/, key: 'noSuchColumn', params: (m) => ({ column: m[1]! }) },
  { pattern: /^near "(.+)": syntax error$/s, key: 'syntaxNear', params: (m) => ({ token: m[1]! }) },
  { pattern: /^incomplete input$/, key: 'incomplete' },
  { pattern: /^unrecognized token: "(.*)"$/s, key: 'unrecognizedToken', params: (m) => ({ token: m[1]! }) },
  { pattern: /^ambiguous column name: (.+)$/, key: 'ambiguousColumn', params: (m) => ({ column: m[1]! }) },
  { pattern: /^misuse of aggregate(?: function)?:? (\w+)\(\)$/, key: 'aggregateMisuse', params: (m) => ({ fn: m[1]! }) },
  { pattern: /^a GROUP BY clause is required before HAVING$/, key: 'havingWithoutGroupBy' },
  { pattern: /^UNIQUE constraint failed: (.+)$/, key: 'unique', params: (m) => ({ column: m[1]! }) },
  { pattern: /^NOT NULL constraint failed: (.+)$/, key: 'notNull', params: (m) => ({ column: m[1]! }) },
  { pattern: /^CHECK constraint failed/, key: 'check' },
  { pattern: /^FOREIGN KEY constraint failed$/, key: 'foreignKey' },
  {
    pattern: /^table (\S+) has (\d+) columns but (\d+) values were supplied$/,
    key: 'valuesForTable',
    params: (m) => ({ table: m[1]!, columns: m[2]!, values: m[3]! }),
  },
  { pattern: /^(\d+) values for (\d+) columns$/, key: 'valuesForColumns', params: (m) => ({ values: m[1]!, columns: m[2]! }) },
  { pattern: /^wrong number of arguments to function (\w+)\(\)$/, key: 'functionArgs', params: (m) => ({ fn: m[1]! }) },
  { pattern: /^no such function: (\w+)$/, key: 'noSuchFunction', params: (m) => ({ fn: m[1]! }) },
  { pattern: /^sub-select returns (\d+) columns - expected 1$/, key: 'subqueryColumns', params: (m) => ({ count: m[1]! }) },
  { pattern: /^row value misused$/, key: 'rowValueMisused' },
  { pattern: /^table (\S+) already exists$/, key: 'tableExists', params: (m) => ({ table: m[1]! }) },
  { pattern: /^no tables specified$/, key: 'noTables' },
];

/** Every error key this module (and the SQL client) can produce, for i18n coverage tests. */
export const ERROR_KEYS = [...RULES.map((r) => r.key), 'empty', 'timeout', 'generic'];
export const TIP_KEYS = ['didYouMean', 'quoteText', 'closeQuote'];

export interface ErrorContext {
  /** Column names that exist in the level database (lower case), to detect unquoted text values. */
  knownColumns?: string[];
}

/** Turns a raw SQLite error message into an i18n key + params, with an optional tip. */
export function describeSqlError(raw: string, context: ErrorContext = {}): SqlErrorInfo {
  for (const rule of RULES) {
    const m = raw.match(rule.pattern);
    if (!m) continue;
    const params = rule.params?.(m) ?? {};
    const info: SqlErrorInfo = { key: rule.key, params, raw };

    if (rule.key === 'syntaxNear') {
      const suggestion = suggestKeyword(params.token ?? '');
      if (suggestion) info.tip = { key: 'didYouMean', params: { keyword: suggestion } };
    } else if (rule.key === 'noSuchColumn') {
      const column = params.column ?? '';
      const known = context.knownColumns ?? [];
      const bare = column.includes('.') ? column.slice(column.lastIndexOf('.') + 1) : column;
      const typo = closest(bare, known);
      if (typo) {
        // `nme` → "Did you mean name?"
        info.tip = { key: 'didYouMean', params: { keyword: typo } };
      } else if (!column.includes('.') && known.length > 0 && !known.includes(column.toLowerCase())) {
        // `role = pawn`: an unquoted word that is not a column is probably a text value.
        info.tip = { key: 'quoteText', params: { value: column } };
      }
    } else if (rule.key === 'unrecognizedToken' && /^'/.test(params.token ?? '')) {
      info.tip = { key: 'closeQuote', params: {} };
    }
    return info;
  }
  return { key: 'generic', params: { message: raw }, raw };
}

/** Error for an editor with nothing to run. */
export function emptyQueryError(): SqlErrorInfo {
  return { key: 'empty', params: {}, raw: '' };
}
