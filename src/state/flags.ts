import type { KeyValueStore } from './storage';

/**
 * One-time choices kept apart from the progress, so that starting over does not bring them back.
 * (The "star it on GitHub" flag lives in progress.ts as STAR_KEY for the same reason.)
 */
export const DEVICE_NOTE_KEY = 'kor.device-note.v1';

export function isFlagSet(store: KeyValueStore, key: string): boolean {
  return store.get(key) !== null;
}

export function setFlag(store: KeyValueStore, key: string): void {
  store.set(key, '1');
}
