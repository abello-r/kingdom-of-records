import { describe, expect, it } from 'vitest';
import { DEVICE_NOTE_KEY, isFlagSet, setFlag } from './flags';
import { Progress, PROGRESS_KEY } from './progress';
import { createMemoryStore } from './storage';

describe('one-time flags', () => {
  it('remember a dismissed note, even after starting over', () => {
    const store = createMemoryStore();
    expect(isFlagSet(store, DEVICE_NOTE_KEY)).toBe(false);
    setFlag(store, DEVICE_NOTE_KEY);
    new Progress(store).reset();
    expect(store.get(PROGRESS_KEY)).toBeNull();
    expect(isFlagSet(store, DEVICE_NOTE_KEY)).toBe(true);
  });
});
