/**
 * Minimal key/value storage abstraction.
 * localStorage can be missing or throw (private mode, blocked site data), so every access is guarded
 * and the game keeps working in memory when it is unavailable.
 */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
  };
}

export function createBrowserStore(): KeyValueStore {
  const fallback = createMemoryStore();
  const ls = (): Storage | null => {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  };
  return {
    get(key) {
      try {
        return ls()?.getItem(key) ?? fallback.get(key);
      } catch {
        return fallback.get(key);
      }
    },
    set(key, value) {
      fallback.set(key, value);
      try {
        ls()?.setItem(key, value);
      } catch {
        /* quota exceeded or storage blocked: keep the in-memory copy */
      }
    },
    remove(key) {
      fallback.remove(key);
      try {
        ls()?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Reads and parses JSON, returning `null` on missing or corrupt data. */
export function readJson(store: KeyValueStore, key: string): unknown {
  const raw = store.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
