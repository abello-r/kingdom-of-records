import { asset, img, prefersReducedMotion } from './dom';

const TILE = 64;
const ROLE: Record<string, [number, number]> = {
  tl: [0, 0], t: [1, 0], tr: [2, 0], l: [0, 1], c: [1, 1], r: [2, 1], bl: [0, 2], b: [1, 2], br: [2, 2],
};

export type Terrain = 'spring' | 'meadow' | 'autumn' | 'dusk';

export interface PutOptions {
  scale?: number;
  flip?: boolean;
  /** Raised above everything at its depth (e.g. archers standing on a tower). */
  above?: boolean;
  /** Celebration frame to show when the world celebrates. */
  cheer?: string;
  dim?: boolean;
}

/**
 * A pixel-art diorama: water, islands built tile by tile and sprites anchored by their feet.
 * Purely decorative, so it is hidden from assistive technology.
 */
export class World {
  readonly el: HTMLDivElement;

  constructor(className = '') {
    this.el = document.createElement('div');
    this.el.className = `world ${className}`.trim();
    this.el.setAttribute('aria-hidden', 'true');
  }

  /** Flat island of cols x rows tiles with its top-left corner at (x, y), and foam around it. */
  island(x: number, y: number, cols: number, rows: number, terrain: Terrain, dim = false): void {
    const frag = document.createDocumentFragment();
    const tiles: HTMLElement[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const role = (r === 0 ? 't' : r === rows - 1 ? 'b' : '') + (c === 0 ? 'l' : c === cols - 1 ? 'r' : '') || 'c';
        const [tx, ty] = ROLE[role] ?? ROLE.c!;
        if (role !== 'c') {
          const foam = document.createElement('div');
          foam.className = 'foam';
          foam.style.left = `${x + c * TILE - TILE}px`;
          foam.style.top = `${y + r * TILE - TILE}px`;
          frag.prepend(foam);
        }
        const tile = document.createElement('div');
        tile.className = dim ? 'tile dim' : 'tile';
        tile.style.left = `${x + c * TILE}px`;
        tile.style.top = `${y + r * TILE}px`;
        tile.style.backgroundImage = `url("${asset(`terrain/island-${terrain}.png`)}")`;
        tile.style.backgroundPosition = `${-tx * TILE}px ${-ty * TILE}px`;
        tiles.push(tile);
      }
    }
    frag.append(...tiles);
    this.el.append(frag);
  }

  /** Places a sprite so that its feet (bottom centre) sit at (x, y). Depth follows y. */
  put(path: string, x: number, y: number, opts: PutOptions = {}): HTMLImageElement {
    const sprite = img(`${path}.png`, 'sprite');
    const k = opts.scale ?? 1;
    sprite.style.left = `${Math.round(x)}px`;
    sprite.style.top = `${Math.round(y)}px`;
    sprite.style.setProperty('--sx', String(opts.flip ? -k : k));
    sprite.style.setProperty('--sy', String(k));
    sprite.style.zIndex = String((opts.above ? 2000 : 100) + Math.round(y));
    if (opts.cheer) {
      sprite.dataset.cheer = asset(`${opts.cheer}.png`);
      sprite.dataset.idle = sprite.src;
    }
    if (opts.dim) sprite.classList.add('dim');
    this.el.append(sprite);
    return sprite;
  }

  cloud(n: 1 | 2 | 3 | 5, x: number, y: number, scale = 1): void {
    const c = img(`props/cloud-${n}.png`, 'cloud');
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.width = `${Math.round(576 * scale)}px`;
    this.el.append(c);
  }

  /**
   * Characters with a celebration frame switch to it and hop; a puff of dust appears at their feet.
   * With `animate: false` (e.g. when a solved page is redrawn) they only keep the pose.
   */
  celebrate(animate = true): void {
    const still = !animate || prefersReducedMotion();
    this.el.querySelectorAll<HTMLImageElement>('img.sprite[data-cheer]').forEach((s, i) => {
      s.src = s.dataset.cheer!;
      if (still) return;
      s.classList.add('hop');
      s.style.animationDelay = `${(i % 4) * 90}ms`;
      const dust = img('fx/dust.png', 'sprite dust');
      dust.style.left = s.style.left;
      dust.style.top = `${parseInt(s.style.top, 10) + 6}px`;
      dust.style.zIndex = s.style.zIndex;
      dust.style.setProperty('--sx', '.8');
      dust.style.setProperty('--sy', '.8');
      this.el.append(dust);
    });
  }

  clear(): void {
    this.el.replaceChildren();
  }
}
