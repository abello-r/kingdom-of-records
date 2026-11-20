import monoUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import { cssUrl } from './dom';

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
    foam: 'terrain/foam.png',
  };
  for (const colour of ['blue', 'red', 'yellow', 'purple', 'black']) {
    images[`ribbon-${colour}`] = `ui/ribbon-${colour}.png`;
    images[`ribbon-small-${colour}`] = `ui/ribbon-small-${colour}.png`;
  }
  for (const [name, path] of Object.entries(images)) root.setProperty(`--img-${name}`, cssUrl(path));

  if (typeof FontFace === 'function') {
    const quotes = new FontFace('KOR Quotes', `url("${monoUrl}")`, { unicodeRange: 'U+00AB, U+00BB' });
    document.fonts.add(quotes);
    void quotes.load().catch(() => undefined);
  }
}
