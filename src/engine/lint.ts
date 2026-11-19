/**
 * Gentle, non-blocking advice about the player's SQL.
 *
 * SQLite accepts `role = "archer"`: when "archer" is not a column it falls back to treating it as text.
 * It works, but it is a bad habit (standard SQL uses double quotes for names), so the game points it out
 * without rejecting the answer.
 */

/** Contents of every double-quoted token, skipping single-quoted texts and comments. */
export function doubleQuotedTokens(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === '-' && next === '-') {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? sql.length : end + 1;
    } else if (c === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      let value = '';
      while (j < sql.length) {
        if (sql[j] === c && sql[j + 1] === c) {
          value += c;
          j += 2;
        } else if (sql[j] === c) {
          break;
        } else {
          value += sql[j];
          j += 1;
        }
      }
      if (c === '"') tokens.push(value);
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return tokens;
}

/** Double-quoted tokens that are not the name of any table or column (so SQLite read them as text). */
export function doubleQuotedValues(sql: string, knownNames: readonly string[]): string[] {
  const known = new Set(knownNames.map((n) => n.toLowerCase()));
  const values = doubleQuotedTokens(sql).filter((t) => !known.has(t.toLowerCase()));
  return [...new Set(values)];
}
