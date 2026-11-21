/**
 * Level dioramas: what the strip above the Registry shows for each level, and how the world reacts when
 * the spell is right (the core idea of the game: the data you query changes the kingdom).
 * Positions are fractions of the width so scenes adapt to any screen; `wide` items are skipped on phones.
 */
import type { LevelId } from '../state/levels';
import type { PutOptions, Sprite, SpriteName, World } from './world';

export interface Kit {
  world: World;
  compact: boolean;
  /** Sprite scale for this screen size. */
  k: number;
  /** y of the ground line. */
  ground: number;
  /** Places a sprite at fraction `f` of the width; `dy` moves it down from the ground line (px at scale 1). */
  put(name: SpriteName, f: number, opts?: PutOptions & { dy?: number; s?: number; wide?: boolean }): Sprite | null;
  /** Pixel position for a fraction of the width / an offset from the ground. */
  x(f: number): number;
  y(dy?: number): number;
  /**
   * Places a unit standing on the wooden floor of the tower put at (f, towerDy), centred between its
   * battlements and drawn over it.
   */
  onTower(name: SpriteName, f: number, towerDy: number, opts?: PutOptions): Sprite | null;
}

/** Applies the reaction: animated after a correct answer, instant when redrawing a solved page. */
export type Solve = () => void;
export interface LevelScene {
  /** Fraction of the width covered by land (the rest is water); 1 by default. */
  land?: number;
  build(kit: Kit): Solve;
}

const stagger = (i: number, step = 220, start = 150) => start + i * step;

export const LEVEL_SCENES: Record<LevelId, LevelScene> = {
  // Who lives here? — the villagers gather in the square.
  'easy-1': {
    build({ put, world }) {
      put('buildings/house-1', 0.16, { dy: -12 });
      put('buildings/house-2', 0.84, { dy: -12 });
      put('units/warrior-blue', 0.45, { dy: 8, flip: true });
      put('units/pawn-blue', 0.51, { dy: 10 });
      const crowd = [
        put('units/archer-blue', 0.29, { dy: 12, hidden: true }),
        put('units/monk-blue', 0.36, { dy: 16, hidden: true, wide: true }),
        put('units/pawn-blue', 0.58, { dy: 14, hidden: true }),
        put('units/archer-blue', 0.65, { dy: 12, hidden: true, flip: true }),
        put('units/pawn-blue-wood', 0.71, { dy: 16, hidden: true, flip: true, wide: true }),
        put('units/sheep', 0.76, { dy: 18, hidden: true }),
      ];
      return () => crowd.forEach((s, i) => world.appear(s, stagger(i, 180)));
    },
  },
  // Eyes on the towers — the archers climb the four towers.
  'easy-2': {
    build({ put, onTower, world }) {
      const towers = [0.14, 0.38, 0.62, 0.86];
      towers.forEach((f, i) => put('buildings/tower', f, { dy: i % 2 ? -4 : -10 }));
      const ground = [0.45, 0.49, 0.53, 0.57].map((f, i) => put('units/archer-blue', f, { dy: 10 + (i % 2) * 4, flip: i % 2 === 1 }));
      const tops = towers.map((f, i) => onTower('units/archer-blue', f, i % 2 ? -4 : -10, { hidden: true, flip: f > 0.5 }));
      return () => {
        ground.forEach((s, i) => world.vanish(s, stagger(i, 160)));
        tops.forEach((s, i) => world.appear(s, stagger(i, 260, 420)));
      };
    },
  },
  // Hands to rebuild — woodcutters to the trees, miners to the rock.
  'easy-3': {
    build({ put, world, x, y }) {
      put('props/tree-3', 0.12, { dy: 0 });
      put('props/tree-4', 0.24, { dy: 4 });
      put('buildings/house-1', 0.5, { dy: -14, wide: true });
      put('props/gold-stone', 0.84, { dy: 0 });
      const pawns = [0.4, 0.46, 0.55, 0.61].map((f, i) => put('units/pawn-blue', f, { dy: 14 + (i % 2) * 4, flip: i > 1 }));
      const jobs: [number, SpriteName, boolean][] = [
        [0.17, 'units/pawn-blue-axe', false],
        [0.3, 'units/pawn-blue-axe', true],
        [0.77, 'units/pawn-blue-pickaxe', false],
        [0.9, 'units/pawn-blue-pickaxe', true],
      ];
      return () =>
        pawns.forEach((p, i) => {
          const [f, end] = jobs[i]!;
          world.move(p, x(f), y(16), { run: 'units/pawn-blue-run', end, delay: stagger(i, 160), ms: 1100 });
        });
    },
  },
  // The Lan flock — the lost sheep are spotted by Riverwatch, at the water's edge.
  'easy-4': {
    land: 0.76,
    build({ put, world, x, y }) {
      put('buildings/house-3', 0.12, { dy: -12 });
      put('units/sheep-grazing', 0.22, { dy: 16 });
      put('units/sheep', 0.27, { dy: 22, flip: true, wide: true });
      put('buildings/tower', 0.66, { dy: -6 });
      put('props/water-rock', 0.88, { dy: -30 });
      put('props/duck', 0.94, { dy: -10, wide: true });
      const pip = put('units/pawn-blue', 0.38, { dy: 14 });
      const lost = [0.53, 0.6, 0.72].map((f, i) => put('units/sheep', f, { dy: 18 + (i % 2) * 6, hidden: true, flip: i === 2 }));
      return () => {
        world.move(pip, x(0.46), y(14), { run: 'units/pawn-blue-run', ms: 800 });
        lost.forEach((s, i) => world.appear(s, stagger(i, 300, 700)));
      };
    },
  },
  // The King's scribe — the burnt houses are rebuilt; the royal storehouse stays looted.
  'easy-5': {
    build({ put, world }) {
      const homes: SpriteName[] = ['buildings/house-1', 'buildings/house-2', 'buildings/house-3'];
      const ruins = [0.2, 0.42, 0.64].map((f) => put('buildings/house-ruin', f, { dy: -2 }));
      const fires = [0.2, 0.42, 0.64].map((f) => put('fx/fire', f, { dy: 8, above: true }));
      put('buildings/house-ruin', 0.86, { dy: 0 });
      put('fx/fire', 0.86, { dy: 10, above: true, s: 0.8 });
      const builders = [0.31, 0.53].map((f) => put('units/pawn-blue-hammer', f, { dy: 18, hidden: true }));
      return () => {
        fires.forEach((s, i) => world.vanish(s, stagger(i, 300)));
        ruins.forEach((s, i) => world.swap(s, homes[i]!, stagger(i, 300, 400)));
        builders.forEach((s, i) => world.appear(s, stagger(i, 200, 300)));
      };
    },
  },
  // A report for the king — gold, wood and meat are counted in front of the castle.
  'medium-1': {
    build({ put, world }) {
      put('buildings/castle', 0.5, { dy: -14 });
      put('buildings/tower', 0.13, { dy: -6, wide: true });
      put('buildings/tower', 0.87, { dy: -6, wide: true });
      const carriers = [
        put('units/pawn-blue-gold', 0.3, { dy: 22, hidden: true }),
        put('units/pawn-blue-wood', 0.7, { dy: 22, hidden: true, flip: true }),
      ];
      const piles = [
        put('props/gold-pile', 0.4, { dy: 26, hidden: true }),
        put('props/wood-pile', 0.5, { dy: 26, hidden: true, s: 1.6 }),
        put('props/meat', 0.6, { dy: 26, hidden: true, s: 1.6 }),
      ];
      return () => {
        carriers.forEach((s, i) => world.appear(s, stagger(i, 200)));
        piles.forEach((s, i) => world.appear(s, stagger(i, 250, 600)));
      };
    },
  },
  // Village by village — each village shows what it holds.
  'medium-2': {
    build({ put, world, compact }) {
      const villages = [0.1, 0.3, 0.5, 0.7, 0.9];
      const houses: SpriteName[] = ['buildings/house-1', 'buildings/house-2', 'buildings/house-3', 'buildings/house-1', 'buildings/house-2'];
      villages.forEach((f, i) => put(houses[i]!, f, { dy: -12, s: compact ? 0.8 : 1 }));
      const loot: SpriteName[] = ['props/wood-pile', 'props/meat', 'props/wood-pile', 'props/meat', 'props/gold-stone'];
      const piles = villages.map((f, i) => put(loot[i]!, f + 0.06, { dy: 22, hidden: true, s: loot[i] === 'props/gold-stone' ? 0.7 : 1.6 }));
      return () => piles.forEach((s, i) => world.appear(s, stagger(i, 200)));
    },
  },
  // The villages that will hold — garrisons march to the three villages that can feed them.
  'medium-3': {
    build({ put, world, compact, x, y }) {
      const villages = [0.1, 0.3, 0.5, 0.7, 0.9];
      const houses: SpriteName[] = ['buildings/house-1', 'buildings/house-2', 'buildings/house-3', 'buildings/house-1', 'buildings/house-2'];
      villages.forEach((f, i) => put(houses[i]!, f, { dy: -12, s: compact ? 0.8 : 1 }));
      // Bluebrook, Oakhollow and Fernvale (1st, 3rd and 4th) get soldiers.
      const chosen = [0, 2, 3];
      const soldiers = chosen.map(() => put('units/warrior-blue', 0.5, { dy: 24, hidden: true }));
      return () =>
        soldiers.forEach((s, i) => {
          world.appear(s, stagger(i, 150));
          world.move(s, x(villages[chosen[i]!]! + 0.06), y(22), { run: 'units/warrior-blue-run', delay: stagger(i, 150, 450), ms: 900 });
        });
    },
  },
  // Merchants who smell of swamp — the fake merchants vanish; the guards go to the storehouse.
  'medium-4': {
    build({ put, world, x, y }) {
      put('buildings/house-2', 0.1, { dy: -12, wide: true });
      const goblins = [0.27, 0.36, 0.45].map((f, i) => put('units/goblin-torch', f, { dy: 12 + (i % 2) * 4 }));
      const guards = [0.56, 0.62, 0.68].map((f, i) => put('units/warrior-blue', f, { dy: 14 + (i % 2) * 4, flip: true }));
      put('buildings/barracks', 0.88, { dy: -12 });
      return () => {
        goblins.forEach((s, i) => world.vanish(s, stagger(i, 220)));
        guards.forEach((s, i) => world.move(s, x(0.75 + i * 0.05), y(22), { run: 'units/warrior-blue-run', delay: stagger(i, 160, 600) }));
      };
    },
  },
  // The unguarded tower — Riverwatch has no guard; Sir Garrick is found at its foot.
  'medium-5': {
    build({ put, onTower, world }) {
      const towers = [0.15, 0.4, 0.65, 0.88];
      towers.forEach((f, i) => put('buildings/tower', f, { dy: i % 2 ? -4 : -10 }));
      towers.forEach((f, i) => {
        if (i !== 1) onTower('units/archer-blue', f, i % 2 ? -4 : -10, { flip: f > 0.5 });
      });
      const garrick = put('units/warrior-red', 0.46, { dy: 20, hidden: true, flip: true });
      return () => world.appear(garrick, 300);
    },
  },
  // Loot of the frontier — every goblin's loot comes to light.
  'hard-1': {
    build({ put, world }) {
      put('buildings/goblin-house', 0.14, { dy: -10 });
      put('buildings/goblin-tower', 0.52, { dy: -8, wide: true });
      put('buildings/goblin-house', 0.88, { dy: -10 });
      [0.28, 0.4, 0.66, 0.76].forEach((f, i) =>
        put(i % 2 ? 'units/goblin-tnt' : 'units/goblin-torch', f, { dy: 12, flip: f > 0.5 }));
      const loot: [SpriteName, number][] = [['props/gold-pile', 0.33], ['props/meat', 0.45], ['units/sheep', 0.71], ['props/gold-pile', 0.81]];
      const piles = loot.map(([name, f]) => put(name, f, { dy: 24, hidden: true, s: name === 'props/gold-pile' ? 0.9 : name === 'props/meat' ? 1.6 : 1 }));
      return () => piles.forEach((s, i) => world.appear(s, stagger(i, 220)));
    },
  },
  // What never came back — the recovered goods are carried home; the royal gold is not among them.
  'hard-2': {
    build({ put, world, x, y }) {
      put('buildings/house-1', 0.1, { dy: -12 });
      put('buildings/goblin-house', 0.8, { dy: -10 });
      const piles = [put('props/wood-pile', 0.7, { dy: 22, s: 1.6 }), put('props/meat', 0.76, { dy: 24, s: 1.6 })];
      put('units/goblin-torch', 0.92, { dy: 14, flip: true, wide: true });
      const carriers = [
        put('units/pawn-blue-run-wood', 0.7, { dy: 22, hidden: true, flip: true }),
        put('units/pawn-blue-run-meat', 0.76, { dy: 24, hidden: true, flip: true }),
      ];
      return () => {
        piles.forEach((s, i) => world.vanish(s, stagger(i, 120)));
        carriers.forEach((s, i) => {
          world.appear(s, stagger(i, 120));
          world.move(s, x(0.2 + i * 0.08), y(20), { delay: stagger(i, 120, 500), ms: 1600, end: i ? 'units/pawn-blue-meat' : 'units/pawn-blue-wood' });
        });
      };
    },
  },
  // The greediest of them all — Kragg and Gorb are caught; Grubnak runs for it.
  'hard-3': {
    build({ put, world, x, y }) {
      put('buildings/goblin-house', 0.08, { dy: -10, wide: true });
      put('units/goblin-torch', 0.2, { dy: 12 });
      const kragg = put('units/goblin-tnt', 0.36, { dy: 14 });
      const gorb = put('units/goblin-tnt', 0.5, { dy: 12, flip: true });
      const grubnak = put('units/goblin-torch', 0.66, { dy: 14, s: 1.15 });
      put('units/goblin-tnt', 0.82, { dy: 12, flip: true, wide: true });
      const captors = [put('units/warrior-blue', 0.36, { dy: 14, hidden: true }), put('units/warrior-blue', 0.5, { dy: 12, hidden: true, flip: true })];
      return () => {
        world.vanish(kragg, 150);
        world.vanish(gorb, 350);
        captors.forEach((s, i) => world.appear(s, stagger(i, 200, 300)));
        world.move(grubnak, x(1.1), y(14), { run: 'units/goblin-torch-run', delay: 500, ms: 1300 });
      };
    },
  },
  // Where the booms are — Skull Rock's TNT goes off, and Grubnak is caught with his ledger.
  'hard-4': {
    build({ put, world, x, y }) {
      const camps = [0.16, 0.5, 0.82];
      camps.forEach((f) => put('buildings/goblin-house', f, { dy: -10 }));
      put('units/goblin-tnt', 0.26, { dy: 12 });
      put('units/goblin-tnt', 0.6, { dy: 14, wide: true });
      const skull = put('units/goblin-tnt', 0.92, { dy: 12, flip: true });
      const grubnak = put('units/goblin-torch', 0.76, { dy: 20, hidden: true });
      const knights = [put('units/warrior-blue', 0.68, { dy: 20, hidden: true }), put('units/warrior-blue', 0.86, { dy: 22, hidden: true, flip: true })];
      return () => {
        world.fx('fx/explosion', x(0.86), y(4), 100);
        world.sound('explosion', 100);
        world.vanish(skull, 300);
        world.appear(grubnak, 900);
        knights.forEach((s, i) => world.appear(s, stagger(i, 200, 1100)));
      };
    },
  },
  // The traitor with the red seal — Corvin is arrested; the royal gold is in his coffers.
  'hard-5': {
    build({ put, world }) {
      put('buildings/castle', 0.5, { dy: -18, wide: true });
      put('units/warrior-blue', 0.2, { dy: 16 });
      put('units/monk-purple', 0.29, { dy: 18 }); // Lady Maud
      put('units/monk-red', 0.6, { dy: 18, flip: true });
      put('units/warrior-red', 0.8, { dy: 16, flip: true });
      const guards = [put('units/warrior-blue', 0.53, { dy: 20, hidden: true }), put('units/warrior-blue', 0.68, { dy: 20, hidden: true, flip: true })];
      const gold = put('props/gold-pile', 0.61, { dy: 34, hidden: true });
      return () => {
        guards.forEach((s, i) => world.appear(s, stagger(i, 250)));
        world.appear(gold, 900);
      };
    },
  },
};
