// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { loadLevels } from '../levels';
import { LEVEL_SCENES } from './reactions';
import { levelStrip } from './scenes';
import { World } from './world';

const levels = [...loadLevels().values()];

/** A fingerprint of what the diorama shows: each visible sprite and where it stands. */
function snapshot(world: World): string {
  return [...world.el.querySelectorAll<HTMLElement>('.sprite:not(.is-hidden)')]
    .map((s) => `${s.dataset.idle}@${s.style.left},${s.style.top}`)
    .sort()
    .join('|');
}

describe('level dioramas', () => {
  it('every level has its own scene', () => {
    expect(levels.map((l) => l.id).filter((id) => !(id in LEVEL_SCENES))).toEqual([]);
  });

  for (const [label, width, height] of [['desktop', 1440, 262], ['phone', 390, 150]] as const) {
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
  }
});
