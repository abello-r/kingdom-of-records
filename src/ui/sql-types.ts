/** Plain-language name for a column type, following SQLite's type affinity rules. */
export type TypeKey = 'integer' | 'text' | 'real' | 'blob';

export function typeKey(declared: string): TypeKey | null {
  const t = declared.toUpperCase();
  if (t.includes('INT')) return 'integer';
  if (t.includes('CHAR') || t.includes('CLOB') || t.includes('TEXT')) return 'text';
  if (t.includes('REAL') || t.includes('FLOA') || t.includes('DOUB')) return 'real';
  if (t.includes('BLOB')) return 'blob';
  return null;
}
