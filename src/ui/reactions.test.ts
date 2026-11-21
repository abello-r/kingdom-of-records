// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { loadLevels } from '../levels';
import { LEVEL_SCENES } from './reactions';
import { HEADER_BAND, isCompact, levelStrip, stripHeight } from './scenes';
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
  }
});
