import { describe, expect, it } from 'vitest';
import { DRAFTS_KEY, HINTS_KEY, LevelMemory } from './level-memory';
import { createMemoryStore } from './storage';

describe('LevelMemory', () => {
  it('counts revealed hints up to the total and persists them', () => {
    const store = createMemoryStore();
    const memory = new LevelMemory(store);
    expect(memory.hintsUsed('easy-1')).toBe(0);
    expect(memory.useHint('easy-1', 3)).toBe(1);
    memory.useHint('easy-1', 3);
    memory.useHint('easy-1', 3);
    expect(memory.useHint('easy-1', 3)).toBe(3);
    expect(new LevelMemory(store).hintsUsed('easy-1')).toBe(3);
  });

  it('keeps one draft per level and forgets empty ones', () => {
    const store = createMemoryStore();
    const memory = new LevelMemory(store);
    memory.saveDraft('easy-2', 'SELECT name FROM villagers');
    expect(new LevelMemory(store).draft('easy-2')).toBe('SELECT name FROM villagers');
    memory.saveDraft('easy-2', '   ');
    expect(new LevelMemory(store).draft('easy-2')).toBeNull();
  });

  it('can restart a single level', () => {
    const memory = new LevelMemory(createMemoryStore());
    memory.useHint('easy-1', 3);
    memory.useHint('easy-2', 3);
    memory.saveDraft('easy-1', 'SELECT 1');
    memory.resetLevel('easy-1');
    expect(memory.hintsUsed('easy-1')).toBe(0);
    expect(memory.draft('easy-1')).toBeNull();
    expect(memory.hintsUsed('easy-2')).toBe(1);
  });

  it('forgets everything on reset', () => {
    const store = createMemoryStore();
    const memory = new LevelMemory(store);
    memory.useHint('easy-1', 3);
    memory.saveDraft('easy-1', 'SELECT 1');
    memory.reset();
    expect(memory.hintsUsed('easy-1')).toBe(0);
    expect(new LevelMemory(store).draft('easy-1')).toBeNull();
  });

  it('ignores corrupt stored data', () => {
    const store = createMemoryStore();
    store.set(HINTS_KEY, JSON.stringify({ 'easy-1': -2, 'easy-2': 'x', 'easy-3': 1 }));
    store.set(DRAFTS_KEY, '[not an object');
    const memory = new LevelMemory(store);
    expect(memory.hintsUsed('easy-1')).toBe(0);
    expect(memory.hintsUsed('easy-3')).toBe(1);
    expect(memory.draft('easy-1')).toBeNull();
  });
});
