import { ALL_LEVELS, STAGES, levelsOf, parseLevelId, type LevelId, type Stage } from './levels';
import { readJson, type KeyValueStore } from './storage';

export const PROGRESS_KEY = 'kor.progress.v1';

interface ProgressData {
  completed: LevelId[];
}

/**
 * Player progress persisted in localStorage.
 * Rules: a stage unlocks when every level of the previous stage is completed;
 * inside a stage, level n unlocks when level n-1 is completed.
 */
export class Progress {
  private completed: Set<LevelId>;

  constructor(private readonly store: KeyValueStore) {
    this.completed = new Set(Progress.load(store));
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

  completedCount(): number {
    return this.completed.size;
  }

  reset(): void {
    this.completed.clear();
    this.store.remove(PROGRESS_KEY);
  }
}
