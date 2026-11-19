import monoUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import { asset } from './dom';

/**
 * Exposes the UI images as CSS custom properties (so stylesheet URLs honour the deployment base path)
 * and registers the guillemet font: Jersey 10 draws « » as two separate chevrons that read like "<<",
 * so those two glyphs are taken from JetBrains Mono.
 */
export function installTheme(): void {
  const root = document.documentElement.style;
  const images: Record<string, string> = {
    paper: 'ui/paper.png',
    wood: 'ui/wood.png',
    'button-round': 'ui/button-round.png',
    'button-round-pressed': 'ui/button-round-pressed.png',
    foam: 'terrain/foam.png',
  };
  for (const colour of ['blue', 'red', 'yellow', 'purple', 'black']) {
    images[`ribbon-${colour}`] = `ui/ribbon-${colour}.png`;
    images[`ribbon-small-${colour}`] = `ui/ribbon-small-${colour}.png`;
  }
  // Absolute URLs: a relative url() inside a custom property resolves against the stylesheet that uses
  // it (dist/assets/…), not the page, which breaks with Vite's relative base in production.
  for (const [name, path] of Object.entries(images)) {
    root.setProperty(`--img-${name}`, `url("${new URL(asset(path), document.baseURI).href}")`);
  }

  if (typeof FontFace === 'function') {
    const quotes = new FontFace('KOR Quotes', `url("${monoUrl}")`, { unicodeRange: 'U+00AB, U+00BB' });
    document.fonts.add(quotes);
    void quotes.load().catch(() => undefined);
  }
}
