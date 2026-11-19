import type { LevelId } from './levels';
import { readJson, type KeyValueStore } from './storage';

export const HINTS_KEY = 'kor.hints.v1';
export const DRAFTS_KEY = 'kor.drafts.v1';

/** Longest draft kept per level, to keep localStorage small. */
const MAX_DRAFT = 4000;

/**
 * Per-level memory kept in the browser: how many hints were revealed and the SQL being written.
 * Both are conveniences; corrupt or missing data simply resets them.
 */
export class LevelMemory {
  private hints: Record<string, number>;
  private drafts: Record<string, string>;

  constructor(private readonly store: KeyValueStore) {
    this.hints = LevelMemory.read(store, HINTS_KEY, (v): v is number => Number.isInteger(v) && (v as number) >= 0);
    this.drafts = LevelMemory.read(store, DRAFTS_KEY, (v): v is string => typeof v === 'string');
  }

  private static read<T>(store: KeyValueStore, key: string, valid: (v: unknown) => v is T): Record<string, T> {
    const data = readJson(store, key);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, v]) => valid(v))) as Record<string, T>;
  }

  hintsUsed(id: LevelId): number {
    return this.hints[id] ?? 0;
  }

  /** Reveals the next hint (up to `total`) and returns how many are now revealed. */
  useHint(id: LevelId, total: number): number {
    const used = Math.min(total, this.hintsUsed(id) + 1);
    this.hints[id] = used;
    this.store.set(HINTS_KEY, JSON.stringify(this.hints));
    return used;
  }

  draft(id: LevelId): string | null {
    return this.drafts[id] ?? null;
  }

  /** Forgets the hints and draft of one level (replaying a completed page from scratch). */
  resetLevel(id: LevelId): void {
    delete this.hints[id];
    delete this.drafts[id];
    this.store.set(HINTS_KEY, JSON.stringify(this.hints));
    this.store.set(DRAFTS_KEY, JSON.stringify(this.drafts));
  }

  /** Forgets every hint and draft (used when the player starts over). */
  reset(): void {
    this.hints = {};
    this.drafts = {};
    this.store.remove(HINTS_KEY);
    this.store.remove(DRAFTS_KEY);
  }

  saveDraft(id: LevelId, sql: string): void {
    if (sql.trim() === '') delete this.drafts[id];
    else this.drafts[id] = sql.slice(0, MAX_DRAFT);
    this.store.set(DRAFTS_KEY, JSON.stringify(this.drafts));
  }
}
