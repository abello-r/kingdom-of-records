type Attrs = Record<string, string | boolean | undefined>;
type Child = Node | string | null | undefined | false;

/** Small helper to build DOM nodes without innerHTML (no injection risk with translated text). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    el.setAttribute(name, value === true ? '' : value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Inline SVG icon from path data, hidden from assistive tech (the button carries the label). */
export function icon(paths: string[], viewBox = '0 0 16 16'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** Pixel-style icons drawn on a 16x16 grid with square shapes only. */
export const ICONS = {
  speaker: 'M2 6h3l4-3v10l-4-3H2z',
  waves: 'M11 6h1v4h-1zM13 4h1v8h-1z',
  cross:
    'M10 6h1v1h-1zM11 7h1v1h-1zM12 8h1v1h-1zM13 9h1v1h-1zM14 10h1v1h-1z' +
    'M14 6h1v1h-1zM13 7h1v1h-1zM11 9h1v1h-1zM10 10h1v1h-1z',
  lock: 'M5 7V5h1V4h4v1h1v2h1v7H4V7zm2 0h2V5H7z',
};
