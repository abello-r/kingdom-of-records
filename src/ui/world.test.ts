// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { World } from './world';

describe('World.settled', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }));
  afterEach(() => vi.useRealTimers());

  it('resolves once the last scheduled operation and its walk are over', async () => {
    const world = new World();
    world.instant = false;
    const a = world.put('units/pawn-blue', 10, 10, { hidden: true });
    const b = world.put('units/pawn-blue', 20, 10);
    world.appear(a, 300);
    world.move(b, 200, 10, { delay: 500, ms: 1000 });
    let done = false;
    void world.settled().then(() => (done = true));
    await vi.advanceTimersByTimeAsync(1400);
    expect(done).toBe(false); // the walk ends at 1500 ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(done).toBe(true);
    world.destroy();
  });

  it('resolves at once when nothing is pending (or the scene is drawn instantly)', async () => {
    const world = new World();
    world.instant = true;
    world.appear(world.put('units/pawn-blue', 10, 10, { hidden: true }), 300);
    let done = false;
    void world.settled().then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });
});
