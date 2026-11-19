/**
 * Rich text for translated messages and level texts:
 * - `code` between backticks becomes a code chip;
 * - `{param}` is replaced by its value, shown as a code chip when it names SQL (tables, columns…);
 * - `'{param}'` (a placeholder wrapped in single quotes) becomes a chip that includes the quotes.
 */

/** Parameters that hold SQL identifiers or code, shown in the code font. */
export const CODE_PARAMS = new Set(['table', 'column', 'token', 'fn', 'value', 'keyword', 'expected', 'actual']);

export type Segment = { kind: 'text'; text: string } | { kind: 'code'; text: string };

/** Splits a template into plain text and code segments. Pure, so it is unit-tested without a DOM. */
export function segments(template: string, params: Record<string, string | number> = {}): Segment[] {
  const out: Segment[] = [];
  const push = (seg: Segment) => {
    const last = out[out.length - 1];
    if (seg.kind === 'text' && last?.kind === 'text') last.text += seg.text;
    else if (seg.text !== '') out.push(seg);
  };
  const re = /`([^`]*)`|'\{(\w+)\}'|\{(\w+)\}/g;
  let pos = 0;
  for (const m of template.matchAll(re)) {
    push({ kind: 'text', text: template.slice(pos, m.index) });
    if (m[1] !== undefined) {
      push({ kind: 'code', text: m[1] });
    } else {
      const name = (m[2] ?? m[3])!;
      const quoted = m[2] !== undefined;
      if (!(name in params)) push({ kind: 'text', text: m[0] });
      else {
        const value = String(params[name]);
        // Counts (e.g. expected: 2) stay plain text; names (e.g. expected: "name, role") are code.
        const isCode = CODE_PARAMS.has(name) && typeof params[name] !== 'number';
        if (quoted) push({ kind: 'code', text: `'${value}'` });
        else push({ kind: isCode ? 'code' : 'text', text: value });
      }
    }
    pos = m.index + m[0].length;
  }
  push({ kind: 'text', text: template.slice(pos) });
  return out;
}

/** DOM fragment for a template. */
export function rich(template: string, params: Record<string, string | number> = {}): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const seg of segments(template, params)) {
    if (seg.kind === 'text') frag.append(seg.text);
    else {
      const code = document.createElement('code');
      code.className = 'chip';
      code.textContent = seg.text;
      frag.append(code);
    }
  }
  return frag;
}
