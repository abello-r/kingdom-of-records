import type { Stage } from '../state/levels';
import type { Terrain, World } from './world';

export const STAGE_TERRAIN: Record<Stage, Terrain> = { easy: 'spring', medium: 'autumn', hard: 'dusk' };

/** Mobile layouts use smaller sprites; sprites are never cut by the screen edge. */
export function isCompact(width: number): boolean {
  return width < 761;
}

/**
 * The strip above the open Registry: one region per stage. Positions are fractions of the width so the
 * scene adapts to any screen; anything that would not fit is simply not placed.
 */
export function levelStrip(world: World, stage: Stage, width: number, height: number): void {
  const compact = isCompact(width);
  const k = compact ? 0.62 : 0.82;
  const ground = height - (compact ? 14 : 22);
  world.island(-64, 36, Math.ceil(width / 64) + 2, Math.ceil(height / 64) + 1, STAGE_TERRAIN[stage]);
  const at = (f: number) => f * width;
  const fits = (x: number, half = 40) => x - half > 0 && x + half < width;
  const put = (path: string, f: number, dy: number, opts: Parameters<World['put']>[3] = {}) => {
    const x = at(f);
    if (fits(x)) world.put(path, x, ground + dy, { scale: k, ...opts });
  };
  const people = (fs: [string, string, number][]) =>
    fs.forEach(([idle, cheer, f], i) => put(idle, f, 4 + (i % 2) * 6, { cheer, flip: i % 2 === 1 }));

  if (stage === 'easy') {
    put('props/tree-1', 0.04, 0, { scale: k * 0.95 });
    put('buildings/tower', 0.14, -14);
    put('buildings/house-1', 0.27, -12);
    put('buildings/tower', 0.37, -6);
    put('buildings/house-ruin', 0.49, -4);
    put('fx/fire', 0.49, 4, { above: true });
    put('buildings/tower', 0.63, -10);
    put('buildings/house-2', 0.74, -12);
    put('buildings/tower', 0.86, -6);
    put('props/tree-2', 0.96, 0, { scale: k * 0.95 });
    people([
      ['units/pawn-blue', 'units/pawn-blue-cheer', compact ? 0.3 : 0.42],
      ['units/warrior-blue', 'units/warrior-blue-cheer', compact ? 0.55 : 0.55],
      ['units/sheep', 'units/sheep-cheer', compact ? 0.78 : 0.58],
    ]);
  } else if (stage === 'medium') {
    put('props/tree-4', 0.04, 0);
    put('buildings/archery', 0.16, -12);
    put('buildings/castle', 0.42, -10);
    put('buildings/barracks', 0.7, -12);
    put('props/gold-stone', 0.84, -4);
    put('buildings/tower', 0.94, -10);
    people([
      ['units/warrior-blue', 'units/warrior-blue-cheer', compact ? 0.25 : 0.27],
      ['units/archer-blue', 'units/archer-blue-cheer', compact ? 0.75 : 0.58],
      ['units/pawn-blue', 'units/pawn-blue-cheer', compact ? 0.5 : 0.62],
    ]);
  } else {
    put('props/tree-3', 0.04, 0);
    put('buildings/goblin-tower', 0.2, -10);
    put('buildings/goblin-house', 0.42, -12);
    put('fx/fire', 0.5, 2, { above: true });
    put('buildings/goblin-house', 0.66, -8);
    put('units/goblin-torch', 0.78, 4);
    put('units/goblin-tnt', 0.9, 8, { flip: true });
    people([
      ['units/warrior-blue', 'units/warrior-blue-cheer', compact ? 0.3 : 0.32],
      ['units/pawn-blue', 'units/pawn-blue-cheer', compact ? 0.55 : 0.36],
    ]);
  }
}

/** Title screen: a wide island at the bottom with the village, the castle and an open square. */
export function homeScene(world: World, width: number, height: number): void {
  const compact = isCompact(width);
  const k = compact ? 0.6 : 1;
  const rows = compact ? 3 : 4;
  const iy = height - rows * 64 - (compact ? 64 : 44);
  world.island(compact ? 24 : 64, iy, Math.max(4, Math.floor((width - (compact ? 48 : 128)) / 64)), rows, 'spring');
  const ground = iy + rows * 64 - (compact ? 40 : 70);
  if (!compact) {
    world.island(width - 330, 120, 3, 2, 'spring');
    world.island(70, 150, 2, 2, 'spring');
    world.put('props/tree-4', width - 260, 250);
    world.put('units/sheep', width - 170, 245);
    world.put('props/gold-stone', 140, 270);
    world.put('props/duck', width - 150, 330);
    world.cloud(1, -120, 40, 0.9);
    world.cloud(3, width - 520, 330, 0.8);
    world.cloud(2, width / 2 + 120, -30, 0.7);
  }
  const put = (path: string, x: number, y: number, opts: Parameters<World['put']>[3] = {}) =>
    world.put(path, x, y, { scale: k, ...opts });
  if (compact) {
    put('buildings/house-1', width * 0.18, ground - 10);
    put('buildings/house-ruin', width * 0.42, ground);
    put('fx/fire', width * 0.42, ground + 6, { above: true });
    put('buildings/tower', width * 0.8, ground - 6);
    put('units/pawn-blue', width * 0.55, ground + 22);
    put('units/sheep', width * 0.68, ground + 26);
    return;
  }
  put('props/tree-1', 110, iy + 140);
  put('buildings/house-1', 200, iy + 160);
  put('buildings/house-ruin', 340, iy + 200);
  put('fx/fire', 322, iy + 205, { above: true });
  put('fx/fire', 372, iy + 215, { scale: 0.75, above: true });
  put('buildings/house-2', 470, iy + 150);
  put('buildings/castle', width - 300, iy + 175);
  put('buildings/tower', width - 90, iy + 190);
  put('units/archer-blue', width - 90, iy + 76, { above: true });
  put('units/sheep', width / 2 - 170, iy + 215);
  put('units/sheep-grazing', width / 2 - 100, iy + 240, { flip: true });
  put('units/pawn-blue', width / 2 + 10, iy + 225);
  put('units/warrior-blue', width / 2 + 110, iy + 228, { flip: true });
  put('units/sheep', width / 2 + 210, iy + 210, { flip: true });
  put('props/bush-1', 250, iy + 246);
  put('props/rock-2', 640, iy + 268);
}

/** One island of the kingdom map (fixed size; the map lays islands out responsively). */
export const MAP_ISLAND = { cols: 6, rows: 5, width: 6 * 64, height: 5 * 64 };

export function mapIsland(world: World, stage: Stage, locked: boolean): void {
  const pad = 32;
  world.island(pad, pad, MAP_ISLAND.cols, MAP_ISLAND.rows, STAGE_TERRAIN[stage], locked);
  const put = (path: string, x: number, y: number, opts: Parameters<World['put']>[3] = {}) =>
    world.put(path, pad + x, pad + y, { dim: locked, ...opts });
  if (stage === 'easy') {
    put('buildings/house-1', 80, 130);
    put('buildings/house-ruin', 200, 120);
    put('buildings/house-2', 320, 135);
  } else if (stage === 'medium') {
    put('buildings/archery', 80, 140, { scale: 0.82 });
    put('buildings/castle', 250, 150, { scale: 0.82 });
  } else {
    put('buildings/goblin-tower', 100, 140);
    put('buildings/goblin-house', 300, 130);
  }
  if (locked) {
    // Clouds drift over the buildings, never over the standards (their padlocks must stay visible).
    world.cloud(2, 10, 20, 0.6);
    world.cloud(5, 110, 110, 0.55);
  }
}
