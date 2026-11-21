import type { Level } from '../engine/types';
import type { Stage } from '../state/levels';
import { LEVEL_SCENES, type Kit, type Solve } from './reactions';
import { drawnCentreOffset, type PutOptions, type Sprite, type Terrain, type World } from './world';

export const STAGE_TERRAIN: Record<Stage, Terrain> = { easy: 'spring', medium: 'autumn', hard: 'dusk' };

/** Phone layouts use smaller sprites and skip `wide` scene items; sprites are never cut by the screen edge. */
export function isCompact(width: number): boolean {
  return width < 761;
}

/**
 * On desktop the level's title ribbon and the controls float over the top of the strip (down to about
 * y 78), so strips keep a band of sea there and draw the land, and every sprite, below it. Phones show
 * the controls above the strip and the title below it, so they need no band.
 */
export const HEADER_BAND = 84;

/**
 * How far above a tower's feet a unit's feet go so it stands on the tower's wooden floor, between the
 * battlements (TS-2 tower: floor centre about 104 px down its 256 px cell; units' feet sit 64 px above
 * the bottom of their 192 px cell). Drawn over the tower, it looks inside: the front battlements are
 * below its feet.
 */
export const TOWER_FLOOR = 88;

/** Height of a level strip (level, title, spell book and epilogue screens), header band included. */
export function stripHeight(width: number): number {
  return isCompact(width) ? 190 : 262 + HEADER_BAND;
}

/** Where the land of a strip starts: just under the header band on desktop. */
export function stripLandTop(width: number): number {
  return isCompact(width) ? 36 : 36 + HEADER_BAND;
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
  const landTop = stripLandTop(width);
  world.island(-64, landTop, cols, Math.ceil((height - landTop) / 64) + 1, STAGE_TERRAIN[level.stage]);

  const x = (f: number) => Math.round(f * width);
  const y = (dy = 0) => Math.round(ground + dy * k);
  const kit: Kit = {
    world,
    compact,
    k,
    ground,
    x,
    y,
    put(name, f, opts: PutOptions & { dy?: number; s?: number; wide?: boolean } = {}) {
      if (opts.wide && compact) return null;
      return world.put(name, x(f), y(opts.dy), { ...opts, scale: k * (opts.s ?? 1) });
    },
    onTower(name, f, towerDy, opts: PutOptions = {}) {
      return world.put(name, x(f) + drawnCentreOffset(name, opts.flip) * k, y(towerDy - TOWER_FLOOR), { ...opts, above: true, scale: k });
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

export interface HomeLayout {
  /** Where the Ko-fi signpost stands (its feet), or null when it is shown as a button. */
  kofi: { x: number; y: number } | null;
  /**
   * The swimming ducks, each with its candidate spots in `data-spots`: the screen moves each one to the
   * first spot that is clear of its texts, buttons, islands and sprites, or takes it out.
   */
  ducks: Sprite[];
}

type Spot = [x: number, y: number];

/** Spots in reading order of `ys` then `xs`, never lower than `maxY`. */
function spots(xs: number[], ys: number[], maxY: number): Spot[] {
  return ys.filter((y) => y <= maxY).flatMap((y) => xs.map((x): Spot => [Math.round(x), y]));
}

/**
 * A rubber duck that swims slowly to the left by `swim` px and back (CSS `swim`; still with reduced
 * motion). A spot is the right end of its course, at its feet; it starts at the first one.
 */
function swimmingDuck(world: World, at: Spot[], swim: number, scale = 1): Sprite | null {
  if (!at.length) return null;
  const duck = world.put('props/duck', at[0]![0], at[0]![1], { scale });
  duck.classList.add('swim');
  duck.style.setProperty('--swim', `${swim}px`);
  duck.dataset.spots = JSON.stringify(at);
  return duck;
}

/**
 * Title screen: a wide island at the bottom with the village, the castle and an open square.
 * With `kofi`, screens from 1350 px get a small islet on the right for the Ko-fi signpost: below the tree
 * islet when there is room above the castle, otherwise in the tree islet's place; smaller screens show a
 * button in the controls bar instead (kofi: null).
 */
export function homeScene(world: World, width: number, height: number, opts: { kofi?: boolean } = {}): HomeLayout {
  const compact = isCompact(width);
  const k = compact ? 0.6 : 1;
  const rows = compact ? 3 : 4;
  // Room for the footer under the island: four short lines on phones, two lines on narrow desktops.
  const iy = height - rows * 64 - (compact ? 86 : width < 1200 ? 64 : 44);
  const left = compact ? 24 : 64;
  const cols = Math.max(4, Math.floor((width - 2 * left) / 64));
  // Everything is placed from the island's own edges, so nothing stands over the water.
  const right = left + cols * 64;
  world.island(left, iy, cols, rows, 'spring');
  const ground = iy + rows * 64 - (compact ? 40 : 70);
  let kofi: HomeLayout['kofi'] = null;
  const ducks: Sprite[] = [];
  const duck = (d: Sprite | null) => void (d && ducks.push(d));
  if (!compact) {
    // Ko-fi islet (3x2 tiles). The sign (scroll + post, about 215 px tall) stands on it, so it starts
    // about 95 px above the islet. Below the tree islet it must clear the tree (feet at y 250); in the
    // tree islet's place it must clear the controls bar (bottom at y 78). The archer on the tower is
    // about 50 px above the island, so the islet must end 16 px above that. From 1350 px the sign
    // (about 310 px wide) also clears the logo.
    const room = iy - 50 - 144;
    const mode = !opts.kofi || width < 1350 ? 'none' : room >= 353 ? 'below' : room >= 190 ? 'instead' : 'none';
    if (mode !== 'instead') {
      world.island(width - 330, 120, 3, 2, 'spring');
      world.put('props/tree-4', width - 260, 250);
      world.put('units/sheep', width - 170, 245);
    }
    if (mode !== 'none') {
      const top = mode === 'below' ? 353 : 190;
      world.island(width - 300, top, 3, 2, 'spring');
      kofi = { x: width - 204, y: top + 118 };
    }
    world.island(70, 150, 2, 2, 'spring');
    world.put('props/gold-stone', 140, 270);
    world.cloud(1, -120, 40, 0.9);
    world.cloud(2, width / 2 + 120, -30, 0.7);
    // The low cloud would sit on the Ko-fi islet.
    if (mode !== 'below') world.cloud(3, width - 520, 330, 0.8);
    // Ducks in the open sea above the big island: two on the left, under the gold islet and beside the
    // logo; one on the right, beside the logo and high enough to clear the castle (about 90 px tall).
    const sea = iy - 24;
    const mid = width / 2;
    duck(swimmingDuck(world, spots([300, 260, 220, 180], [350, 400], sea), 56));
    duck(swimmingDuck(world, spots([mid - 330, mid - 370, 400, 360, 320], [500, 460, 420], sea), 64));
    duck(swimmingDuck(world, spots([mid + 400, mid + 440, mid + 360, mid + 480], [450, 410, 370, 330], iy - 90), 46));
  }
  const put = (name: Parameters<World['put']>[0], x: number, y: number, opts: PutOptions = {}) =>
    world.put(name, x, y, { ...opts, scale: k * (opts.scale ?? 1) });
  if (compact) {
    const span = right - left;
    put('buildings/house-1', left + span * 0.14, ground - 10);
    put('buildings/house-ruin', left + span * 0.36, ground);
    put('fx/fire', left + span * 0.36, ground + 6, { above: true });
    // The tower stands inside the right edge (its drawing is about 68 px wide at this scale).
    put('buildings/tower', right - 44, ground - 6);
    put('units/pawn-blue', left + span * (span >= 300 ? 0.52 : 0.6), ground + 22);
    // The sheep needs room between Pip and the tower; on the narrowest phones it stays out.
    if (span >= 300) put('units/sheep', left + span * 0.68, ground + 26);
    // Two small ducks in the sea just above the island, near its ends, beside the buttons when they
    // come down that far.
    duck(swimmingDuck(world, [[left + 64, iy - 26], [left + 64, iy - 56], [left + 44, iy - 86]], 26, 0.75));
    if (span >= 300) duck(swimmingDuck(world, [[right - 16, iy - 30], [right - 16, iy - 60], [right - 8, iy - 90]], 26, 0.75));
    return { kofi, ducks };
  }
  put('props/tree-1', 110, iy + 140);
  put('buildings/house-1', 200, iy + 160);
  put('buildings/house-ruin', 340, iy + 200);
  put('fx/fire', 322, iy + 205, { above: true });
  put('fx/fire', 372, iy + 215, { scale: 0.75, above: true });
  put('props/bush-1', 250, iy + 246);
  // Castle and tower at the island's right end: the tower (about 112 px drawn) inside the edge.
  const towerX = right - 76;
  const castleX = towerX - 210;
  const castleLeft = castleX - 150;
  if (castleLeft > 545) put('buildings/house-2', 470, iy + 150);
  put('buildings/castle', castleX, iy + 175);
  put('buildings/tower', towerX, iy + 190);
  // The archer stands on the tower's floor, between its battlements.
  put('units/archer-blue', towerX + drawnCentreOffset('units/archer-blue'), iy + 190 - TOWER_FLOOR, { above: true });
  // The crowd fills the square between the houses and the castle; when the square is narrow, the
  // least important figures stay out rather than overlap (Pip and Sir Aldric always come).
  const from = castleLeft > 545 ? 560 : 440;
  const to = castleLeft - 50;
  const crowd: [Parameters<World['put']>[0], number, PutOptions][] = [
    ['units/sheep', 215, {}],
    ['units/sheep-grazing', 240, { flip: true }],
    ['units/pawn-blue', 225, {}],
    ['units/warrior-blue', 228, { flip: true }],
    ['units/sheep', 210, { flip: true }],
  ];
  const priority = [2, 3, 1, 0, 4];
  const count = Math.max(2, Math.min(crowd.length, Math.floor((to - from) / 80) + 1));
  const keep = new Set(priority.slice(0, count));
  const chosen = crowd.filter((_, i) => keep.has(i));
  const step = Math.max(60, Math.min(100, (to - from) / (chosen.length - 1)));
  const start = Math.max(from, (from + to) / 2 - (step * (chosen.length - 1)) / 2);
  chosen.forEach(([name, dy, opts], i) => put(name, start + i * step, iy + dy, opts));
  if (castleLeft > 700) put('props/rock-2', 640, iy + 268);
  return { kofi, ducks };
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
