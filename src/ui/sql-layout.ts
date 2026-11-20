/**
 * Lays out a SQL snippet for reading in a narrow box (hints): one clause per line, one statement per
 * line, and long subqueries on their own indented lines. Text inside quotes is never touched.
 * Pure, so it is unit-tested without a DOM.
 */

/** Clauses that start a new line. */
const CLAUSES = new Set(['FROM', 'WHERE', 'HAVING', 'LIMIT', 'SET', 'VALUES', 'UNION', 'EXCEPT', 'INTERSECT']);
/** Words after which FROM does not start a clause (`DELETE FROM t`). */
const KEEP_FROM = new Set(['DELETE']);
/** Words that start a join (`LEFT JOIN`, `INNER JOIN`…). */
const JOIN_PREFIX = new Set(['LEFT', 'RIGHT', 'INNER', 'CROSS', 'NATURAL', 'FULL', 'OUTER']);
/** A subquery shorter than this stays on its line. */
const INLINE_SUBQUERY = 40;

const TOKEN = /'(?:[^']|'')*'?|"(?:[^"]|"")*"?|\s+|[A-Za-z_][A-Za-z0-9_]*|\.\.\.|[\s\S]/g;

const isWord = (t: string | undefined): t is string => !!t && /^[A-Za-z_]/.test(t);

export function layoutSql(sql: string): string {
  const tokens = sql.trim().match(TOKEN) ?? [];
  // Matching parenthesis of each opening one, to measure subqueries.
  const close = new Map<number, number>();
  const open: number[] = [];
  tokens.forEach((t, i) => {
    if (t === '(') open.push(i);
    else if (t === ')' && open.length) close.set(open.pop()!, i);
  });
  const words = (from: number, step: 1 | -1): string | undefined => {
    for (let i = from + step; i >= 0 && i < tokens.length; i += step) {
      const t = tokens[i]!;
      if (!/^\s+$/.test(t)) return isWord(t) ? t.toUpperCase() : undefined;
    }
    return undefined;
  };

  const lines: string[] = [];
  let indent = 0;
  let line = '';
  let inline = 0; // depth inside parentheses that stay on one line
  const stack: boolean[] = []; // for each open parenthesis: is it a broken-out subquery?
  const newline = () => {
    if (line.trim()) lines.push(line.trimEnd());
    line = '  '.repeat(indent);
  };

  tokens.forEach((t, i) => {
    if (/^\s+$/.test(t)) {
      if (line.trim() && !line.endsWith(' ')) line += ' ';
      return;
    }
    if (isWord(t) && inline === 0 && line.trim()) {
      const w = t.toUpperCase();
      const prev = words(i, -1);
      const next = words(i, 1);
      const starts =
        (CLAUSES.has(w) && !(w === 'FROM' && prev && KEEP_FROM.has(prev))) ||
        ((w === 'GROUP' || w === 'ORDER') && next === 'BY') ||
        (JOIN_PREFIX.has(w) && (next === 'JOIN' || next === 'OUTER') && !(prev && JOIN_PREFIX.has(prev))) ||
        (w === 'JOIN' && !(prev && JOIN_PREFIX.has(prev)));
      if (starts) newline();
    }
    if (t === '(') {
      const end = close.get(i);
      const inner = end === undefined ? '' : tokens.slice(i + 1, end).join('').trim();
      const breakOut = inline === 0 && /^SELECT\b/i.test(inner) && inner.length > INLINE_SUBQUERY;
      stack.push(breakOut);
      line += '(';
      if (breakOut) {
        indent++;
        newline();
      } else inline++;
      return;
    }
    if (t === ')') {
      const brokeOut = stack.pop();
      if (brokeOut) {
        indent--;
        newline();
      } else if (inline > 0) inline--;
      line += ')';
      return;
    }
    line += t;
    if (t === ';' && inline === 0 && tokens.slice(i + 1).some((r) => !/^\s+$/.test(r))) newline();
  });
  newline();
  return lines.join('\n');
}

/** Whether a code snippet reads better as a block (several clauses) than as an inline chip. */
export function isSqlBlock(code: string): boolean {
  return code.length > 32 && layoutSql(code).includes('\n');
}
