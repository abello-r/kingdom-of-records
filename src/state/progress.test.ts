import { describe, expect, it } from 'vitest';
import { levelsOf } from './levels';
import { PROGRESS_KEY, Progress, STAR_KEY } from './progress';
import { createMemoryStore } from './storage';

describe('Progress', () => {
  it('starts with only the first level of the first stage unlocked', () => {
    const p = new Progress(createMemoryStore());
    expect(p.isLevelUnlocked('easy-1')).toBe(true);
    expect(p.isLevelUnlocked('easy-2')).toBe(false);
    expect(p.isStageUnlocked('easy')).toBe(true);
    expect(p.isStageUnlocked('medium')).toBe(false);
    expect(p.isLevelUnlocked('medium-1')).toBe(false);
  });

  it('unlocks levels in order and the next stage when a stage is complete', () => {
    const p = new Progress(createMemoryStore());
    p.complete('easy-1');
    expect(p.isLevelUnlocked('easy-2')).toBe(true);
    expect(p.isLevelUnlocked('easy-3')).toBe(false);

    levelsOf('easy').forEach((id) => p.complete(id));
    expect(p.isStageCompleted('easy')).toBe(true);
    expect(p.isStageUnlocked('medium')).toBe(true);
    expect(p.isLevelUnlocked('medium-1')).toBe(true);
    expect(p.isStageUnlocked('hard')).toBe(false);
  });

  it('knows the next level to read', () => {
    const p = new Progress(createMemoryStore());
    expect(p.nextLevel()).toBe('easy-1');
    levelsOf('easy').forEach((id) => p.complete(id));
    p.complete('medium-1');
    expect(p.nextLevel()).toBe('medium-2');
    [...levelsOf('medium'), ...levelsOf('hard')].forEach((id) => p.complete(id));
    expect(p.nextLevel()).toBeNull();
  });

  it('persists progress across instances', () => {
    const store = createMemoryStore();
    new Progress(store).complete('easy-1');
    const reloaded = new Progress(store);
    expect(reloaded.isCompleted('easy-1')).toBe(true);
    expect(reloaded.completedCount()).toBe(1);
  });

  it('ignores corrupt or unknown stored data', () => {
    const store = createMemoryStore();
    store.set(PROGRESS_KEY, '{not json');
    expect(new Progress(store).completedCount()).toBe(0);

    store.set(PROGRESS_KEY, JSON.stringify({ completed: ['easy-1', 'easy-9', 'boss-1', 42] }));
    const p = new Progress(store);
    expect(p.completedCount()).toBe(1);
    expect(p.isCompleted('easy-1')).toBe(true);
  });

  it('resets all progress', () => {
    const store = createMemoryStore();
    const p = new Progress(store);
    p.complete('easy-1');
    p.reset();
    expect(p.completedCount()).toBe(0);
    expect(store.get(PROGRESS_KEY)).toBeNull();
  });

  it('remembers that the star message was shown, apart from the progress, even after starting over', () => {
    const store = createMemoryStore();
    const p = new Progress(store);
    p.complete('easy-1');
    expect(p.shouldAskForStar()).toBe(true);
    p.markStarAsked();
    expect(store.get(STAR_KEY)).toBe('1');
    expect(JSON.parse(store.get(PROGRESS_KEY)!)).toEqual({ completed: ['easy-1'] });

    p.reset();
    expect(store.get(PROGRESS_KEY)).toBeNull();
    expect(p.shouldAskForStar()).toBe(false);
    expect(new Progress(store).shouldAskForStar()).toBe(false);
  });

  it('moves the star flag of an earlier version out of the progress', () => {
    const store = createMemoryStore();
    store.set(PROGRESS_KEY, JSON.stringify({ completed: ['easy-1'], starAsked: true }));
    const p = new Progress(store);
    expect(p.shouldAskForStar()).toBe(false);
    expect(store.get(STAR_KEY)).toBe('1');
    expect(JSON.parse(store.get(PROGRESS_KEY)!)).toEqual({ completed: ['easy-1'] });
    expect(p.isCompleted('easy-1')).toBe(true);
  });
});
