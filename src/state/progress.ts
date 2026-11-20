import { ALL_LEVELS, STAGES, levelsOf, parseLevelId, type LevelId, type Stage } from './levels';
import { readJson, type KeyValueStore } from './storage';

export const PROGRESS_KEY = 'kor.progress.v1';
/**
 * The "star it on GitHub" message after Easy 3 has been shown. Kept apart from the progress so that
 * starting over does not bring it back: it appears only once, ever.
 */
export const STAR_KEY = 'kor.star.v1';

interface ProgressData {
  completed: LevelId[];
  /** Where an earlier version kept the star flag; read once and moved to STAR_KEY. */
  starAsked?: true;
}

/**
 * Player progress persisted in localStorage.
 * Rules: a stage unlocks when every level of the previous stage is completed;
 * inside a stage, level n unlocks when level n-1 is completed.
 */
export class Progress {
  private completed: Set<LevelId>;
  private starAsked: boolean;

  constructor(private readonly store: KeyValueStore) {
    this.completed = new Set(Progress.load(store));
    const legacy = (readJson(store, PROGRESS_KEY) as Partial<ProgressData> | null)?.starAsked === true;
    this.starAsked = store.get(STAR_KEY) !== null || legacy;
    if (legacy) {
      store.set(STAR_KEY, '1');
      this.save(); // drops the old field
    }
  }

  private static load(store: KeyValueStore): LevelId[] {
    const data = readJson(store, PROGRESS_KEY) as Partial<ProgressData> | null;
    if (!data || !Array.isArray(data.completed)) return [];
    // Drop anything that is not a known level id (corrupt or outdated data).
    return data.completed.filter(
      (id): id is LevelId => typeof id === 'string' && parseLevelId(id) !== null,
    );
  }

  private save(): void {
    const data: ProgressData = { completed: ALL_LEVELS.filter((id) => this.completed.has(id)) };
    this.store.set(PROGRESS_KEY, JSON.stringify(data));
  }

  /** Whether the one-time "star it on GitHub" message is still to be shown. */
  shouldAskForStar(): boolean {
    return !this.starAsked;
  }

  markStarAsked(): void {
    if (this.starAsked) return;
    this.starAsked = true;
    this.store.set(STAR_KEY, '1');
  }

  isCompleted(id: LevelId): boolean {
    return this.completed.has(id);
  }

  complete(id: LevelId): void {
    if (parseLevelId(id) === null || this.completed.has(id)) return;
    this.completed.add(id);
    this.save();
  }

  isStageCompleted(stage: Stage): boolean {
    return levelsOf(stage).every((id) => this.completed.has(id));
  }

  isStageUnlocked(stage: Stage): boolean {
    const i = STAGES.indexOf(stage);
    return i === 0 || this.isStageCompleted(STAGES[i - 1]!);
  }

  isLevelUnlocked(id: LevelId): boolean {
    const parsed = parseLevelId(id);
    if (!parsed || !this.isStageUnlocked(parsed.stage)) return false;
    return parsed.n === 1 || this.completed.has(`${parsed.stage}-${parsed.n - 1}`);
  }

  /** First unlocked level not yet completed, in game order; `null` when everything is done. */
  nextLevel(): LevelId | null {
    return ALL_LEVELS.find((id) => !this.completed.has(id) && this.isLevelUnlocked(id)) ?? null;
  }

  completedCount(): number {
    return this.completed.size;
  }

  reset(): void {
    // The star flag (STAR_KEY) is kept on purpose.
    this.completed.clear();
    this.store.remove(PROGRESS_KEY);
  }
}
