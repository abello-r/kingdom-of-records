import { SQLDialect, SQLite } from '@codemirror/lang-sql';

/**
 * The real SQLite keyword list (https://www.sqlite.org/lang_keywords.html, 147 words).
 * CodeMirror's built-in "SQLite" dialect starts from a generic SQL list that also marks words such as
 * ROLE, NAMES, LEVEL, VALUE or STATE as keywords, which confused players (e.g. the `role` column).
 */
export const SQLITE_KEYWORDS = `abort action add after all alter always analyze and as asc attach autoincrement before begin
between by cascade case cast check collate column commit conflict constraint create cross current current_date current_time
current_timestamp database default deferrable deferred delete desc detach distinct do drop each else end escape except
exclude exclusive exists explain fail filter first following for foreign from full generated glob group groups having if
ignore immediate in index indexed initially inner insert instead intersect into is isnull join key last left like limit
match materialized natural no not nothing notnull null nulls of offset on or order others outer over partition plan pragma
preceding primary query raise range recursive references regexp reindex release rename replace restrict returning right
rollback row rows savepoint select set table temp temporary then ties to transaction trigger unbounded union unique update
using vacuum values view virtual when where window with without`
  .split(/\s+/)
  .filter(Boolean);

/** SQLite dialect for one level: real SQLite keywords, never including the level's own table/column names. */
export function levelDialect(schemaNames: readonly string[]): SQLDialect {
  const names = new Set(schemaNames.map((n) => n.toLowerCase()));
  const keep = (list: readonly string[]) => list.filter((w) => !names.has(w)).join(' ');
  const types = (SQLite.spec.types ?? '').split(/\s+/).filter(Boolean);
  return SQLDialect.define({ ...SQLite.spec, keywords: keep(SQLITE_KEYWORDS), types: keep(types) });
}
