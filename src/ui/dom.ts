type Attrs = Record<string, string | boolean | undefined>;
export type Child = Node | string | null | undefined | false;

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

/** URL of a file in public/assets, honouring Vite's base path. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}

/**
 * CSS url() for an image in public/assets, for custom properties. Absolute: a relative url() inside a
 * custom property resolves against the stylesheet that uses it (dist/assets/…), not the page, which
 * breaks with Vite's relative base in production.
 */
export function cssUrl(path: string): string {
  return `url("${new URL(asset(path), document.baseURI).href}")`;
}

/** Decorative image (empty alt) from public/assets. */
export function img(path: string, cls = ''): HTMLImageElement {
  const el = h('img', { src: asset(path), alt: '', class: cls || undefined, draggable: 'false' });
  el.decoding = 'async';
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

/**
 * Link that opens another site in a new tab (with rel="noopener noreferrer"); screen readers also hear
 * `newTab` (e.g. "opens in a new tab").
 */
export function externalLink(href: string, newTab: string, attrs: Attrs, ...children: Child[]): HTMLAnchorElement {
  return h('a', { ...attrs, href, target: '_blank', rel: 'noopener noreferrer' }, ...children, h('span', { class: 'visually-hidden' }, ` (${newTab})`));
}

/** Pixel-style icons drawn on a 16x16 grid with square shapes only. */
export const ICONS = {
  lock: 'M5 7V5h1V4h4v1h1v2h1v7H4V7zm2 0h2V5H7z',
  /** The kit has no star, so it is drawn like the padlock. */
  star: 'M7 1h2v1h-2zM7 2h2v1h-2zM6 3h4v1h-4zM6 4h4v1h-4zM1 5h14v1h-14zM2 6h12v1h-12zM3 7h10v1h-10zM4 8h8v1h-8zM4 9h8v1h-8zM3 10h10v1h-10zM3 11h4v1h-4zM9 11h4v1h-4zM2 12h4v1h-4zM10 12h4v1h-4zM2 13h3v1h-3zM11 13h3v1h-3z',
};

/** Removes every child and appends the new ones. */
export function fill(el: Element, ...children: Child[]): void {
  el.replaceChildren(...(children.filter((c) => c !== null && c !== undefined && c !== false) as (Node | string)[]));
}

/** True when the user asked the system to reduce motion. */
/**
 * Touch-first device (phone, tablet without mouse): focusing a text field there opens the on-screen
 * keyboard, so the editor only takes the focus when the player taps it.
 */
export function isTouchFirst(): boolean {
  return typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
