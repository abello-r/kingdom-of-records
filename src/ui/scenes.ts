import type { Level } from '../engine/types';
import type { Stage } from '../state/levels';
import { LEVEL_SCENES, type Kit, type Solve } from './reactions';
import type { PutOptions, Terrain, World } from './world';

export const STAGE_TERRAIN: Record<Stage, Terrain> = { easy: 'spring', medium: 'autumn', hard: 'dusk' };

/** Phone layouts use smaller sprites and skip `wide` scene items; sprites are never cut by the screen edge. */
export function isCompact(width: number): boolean {
  return width < 761;
}

/**
 * The strip above the open Registry: the stage's land, trees at its edges and the level's own scene.
 * Returns the level's reaction, to run when the spell is right (or instantly when redrawing a solved page).
 */
export function levelStrip(world: World, level: Level, width: number, height: number): Solve {
  const compact = isCompact(width);
  const k = compact ? 0.6 : 0.82;
  const ground = height - (compact ? 14 : 22);
  // Every level has a scene (tested); the fallback keeps an unknown id from breaking the page.
  const scene = LEVEL_SCENES[level.id] ?? { build: () => () => undefined };
  const land = scene.land ?? 1;
  const cols = land >= 1 ? Math.ceil(width / 64) + 2 : Math.max(3, Math.round((width * land) / 64) + 1);
  world.island(-64, 36, cols, Math.ceil(height / 64) + 1, STAGE_TERRAIN[level.stage]);

  const x = (f: number) => Math.round(f * width);
  const y = (dy = 0) => Math.round(ground + dy * k);
  const kit: Kit = {
    world,
    compact,
    k,
    ground,
    x,
    y,
    towerTop: 137,
    put(name, f, opts: PutOptions & { dy?: number; s?: number; wide?: boolean } = {}) {
      if (opts.wide && compact) return null;
      return world.put(name, x(f), y(opts.dy), { ...opts, scale: k * (opts.s ?? 1) });
    },
  };
  const edge = level.stage === 'easy' ? 'props/tree-1' : level.stage === 'medium' ? 'props/tree-4' : 'props/tree-3';
  // Trees frame the scene on wide screens; on phones they would cover the first and last buildings.
  if (!compact) {
    kit.put(edge, 0.035, { dy: 2, s: 0.95 });
    if (land >= 1) kit.put(edge === 'props/tree-1' ? 'props/tree-2' : edge, 0.965, { dy: 2, s: 0.95 });
  }
  return scene.build(kit);
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
  const put = (name: Parameters<World['put']>[0], x: number, y: number, opts: PutOptions = {}) =>
    world.put(name, x, y, { ...opts, scale: k * (opts.scale ?? 1) });
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
  const put = (name: Parameters<World['put']>[0], x: number, y: number, opts: PutOptions = {}) =>
    world.put(name, pad + x, pad + y, { dim: locked, ...opts });
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
