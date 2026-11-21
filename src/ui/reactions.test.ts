// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { loadLevels } from '../levels';
import { LEVEL_SCENES } from './reactions';
import { HEADER_BAND, homeScene, isCompact, levelStrip, stripHeight } from './scenes';
import manifest from './sprite-manifest.json';
import { World } from './world';

const levels = [...loadLevels().values()];

/** A fingerprint of what the diorama shows: each visible sprite and where it stands. */
function snapshot(world: World): string {
  return [...world.el.querySelectorAll<HTMLElement>('.sprite:not(.is-hidden)')]
    .map((s) => `${s.dataset.idle}@${s.style.left},${s.style.top}`)
    .sort()
    .join('|');
}

/**
 * Sprites whose drawing (the cell without its transparent margin) reaches above `top`: hidden ones too,
 * since a reaction makes them appear.
 */
function above(world: World, top: number): string[] {
  return [...world.el.querySelectorAll<HTMLElement>('.sprite')].flatMap((s) => {
    const m = manifest[s.dataset.idle as keyof typeof manifest];
    const k = Number(s.style.getPropertyValue('--sy'));
    const drawnTop = parseFloat(s.style.top) - (m.h - m.box[1]!) * k;
    return drawnTop < top ? [`${s.dataset.idle} at y ${Math.round(drawnTop)}`] : [];
  });
}

/** Drawn box of a sprite in world pixels (its cell's transparent margin left out). */
function drawn(s: HTMLElement) {
  const m = manifest[s.dataset.idle as keyof typeof manifest];
  const k = Number(s.style.getPropertyValue('--sy'));
  const flip = Number(s.style.getPropertyValue('--sx')) < 0;
  const [x0, y0, x1, y1] = m.box as [number, number, number, number];
  const [left, right] = flip ? [m.w - x1, m.w - x0] : [x0, x1];
  const fx = parseFloat(s.style.left);
  const fy = parseFloat(s.style.top);
  return { k, cx: fx + ((left + right) / 2 - m.w / 2) * k, top: fy - (m.h - y0) * k, bottom: fy - (m.h - y1) * k, feet: fy };
}

/**
 * Units drawn over a tower must stand on its wooden floor, between the battlements: centred on the tower,
 * feet (8 px above the drawn bottom, the shadow) between rows 72 and 120 of its 256 px cell.
 */
function misplacedOnTowers(world: World): string[] {
  const sprites = [...world.el.querySelectorAll<HTMLElement>('.sprite')];
  const towers = sprites.filter((s) => s.dataset.idle === 'buildings/tower').map(drawn);
  return sprites.filter((s) => s.dataset.idle?.startsWith('units/') && Number(s.style.zIndex) >= 2000).flatMap((s) => {
    const u = drawn(s);
    const tower = towers.find((t) => Math.abs(t.cx - u.cx) < 40);
    if (!tower) return [`${s.dataset.idle} above, on no tower`];
    const feet = u.bottom - 8 * u.k;
    const floorTop = tower.feet - (256 - 72) * tower.k;
    const floorBottom = tower.feet - (256 - 120) * tower.k;
    const ok = Math.abs(tower.cx - u.cx) <= 2 && feet >= floorTop && feet <= floorBottom;
    return ok ? [] : [`${s.dataset.idle} at ${Math.round(u.cx)},${Math.round(feet)}; tower floor ${Math.round(tower.cx)}, ${Math.round(floorTop)}-${Math.round(floorBottom)}`];
  });
}

describe('level dioramas', () => {
  it('every level has its own scene', () => {
    expect(levels.map((l) => l.id).filter((id) => !(id in LEVEL_SCENES))).toEqual([]);
  });

  for (const [label, width] of [['desktop', 1440], ['narrow desktop', 1024], ['phone', 390], ['small phone', 360]] as const) {
    const height = stripHeight(width);
    // On desktop the level's title and the controls float over the top band; phones keep them off the strip.
    const header = isCompact(width) ? 0 : HEADER_BAND;

    it.each(levels.map((l) => [l.id, l] as const))(`%s reacts to a correct answer (${label})`, (_id, level) => {
      const world = new World();
      world.instant = true; // apply the end state synchronously
      const solve = levelStrip(world, level, width, height);
      const before = snapshot(world);
      expect(world.el.querySelectorAll('.sprite').length).toBeGreaterThan(2);
      solve();
      expect(snapshot(world)).not.toBe(before);
      expect(world.el.querySelectorAll('.sprite.is-hidden')).toHaveLength(0);
      world.destroy();
    });

    it.each(levels.map((l) => [l.id, l] as const))(`%s keeps every sprite out of the header, before and after its reaction (${label})`, (_id, level) => {
      const world = new World();
      world.instant = true;
      const solve = levelStrip(world, level, width, height);
      expect(above(world, header)).toEqual([]);
      solve();
      expect(above(world, header)).toEqual([]);
      world.destroy();
    });

    it.each(levels.map((l) => [l.id, l] as const))(`%s stands units on towers on their floor (${label})`, (_id, level) => {
      const world = new World();
      world.instant = true;
      const solve = levelStrip(world, level, width, height);
      expect(misplacedOnTowers(world)).toEqual([]);
      solve();
      expect(misplacedOnTowers(world)).toEqual([]);
      world.destroy();
    });
  }

  it('the title screen archer stands on the tower floor', () => {
    for (const [width, height] of [[1440, 900], [1024, 768]] as const) {
      const world = new World();
      homeScene(world, width, height);
      expect(misplacedOnTowers(world)).toEqual([]);
      expect(world.el.querySelectorAll('.sprite[data-idle="units/archer-blue"]')).toHaveLength(1);
    }
  });
});
