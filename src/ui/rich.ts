/**
 * Rich text for translated messages and level texts:
 * - `code` between backticks becomes a code chip;
 * - `{param}` is replaced by its value, shown as a code chip when it names SQL (tables, columns…);
 * - `'{param}'` (a placeholder wrapped in single quotes) becomes a chip that includes the quotes.
 */
import { isSqlBlock, layoutSql } from './sql-layout';

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

/** Chips longer than this may wrap inside their box instead of overflowing it. */
const WRAP_AFTER = 24;

/**
 * DOM fragment for a template. With `blocks`, code made of several clauses is shown as a block with
 * one clause per line (used for hints, which often carry whole queries).
 */
export function rich(template: string, params: Record<string, string | number> = {}, opts: { blocks?: boolean } = {}): DocumentFragment {
  const frag = document.createDocumentFragment();
  let afterBlock = false;
  for (const seg of segments(template, params)) {
    if (seg.kind === 'text') {
      // A block ends its line, so punctuation right after it would start the next line on its own.
      const text = afterBlock ? seg.text.replace(/^\s*[.,;:]?\s*/, '') : seg.text;
      if (text) frag.append(text);
      afterBlock = false;
    } else {
      const code = document.createElement('code');
      afterBlock = false;
      if (opts.blocks && isSqlBlock(seg.text)) {
        code.className = 'chip chip--block';
        // One element per line, so a line too long for the box wraps with a hanging indent.
        for (const line of layoutSql(seg.text).split('\n')) {
          const depth = (line.length - line.trimStart().length) / 2;
          const el = document.createElement('span');
          el.className = 'ln';
          if (depth) el.style.setProperty('--depth', String(depth));
          el.textContent = line.trimStart();
          code.append(el);
        }
        afterBlock = true;
      } else {
        code.className = seg.text.length > WRAP_AFTER ? 'chip chip--wrap' : 'chip';
        code.textContent = seg.text;
      }
      frag.append(code);
    }
  }
  return frag;
}
