/** Game structure shared by progress, level loading and UI. */
export const STAGES = ['easy', 'medium', 'hard'] as const;
export type Stage = (typeof STAGES)[number];

export const LEVELS_PER_STAGE = 5;

/** Level ids match the level file names: `/src/levels/{stage}-{n}.json`. */
export type LevelId = `${Stage}-${number}`;

export function levelId(stage: Stage, n: number): LevelId {
  return `${stage}-${n}`;
}

export function levelsOf(stage: Stage): LevelId[] {
  return Array.from({ length: LEVELS_PER_STAGE }, (_, i) => levelId(stage, i + 1));
}

export const ALL_LEVELS: readonly LevelId[] = STAGES.flatMap(levelsOf);

export function parseLevelId(id: string): { stage: Stage; n: number } | null {
  const m = /^(easy|medium|hard)-(\d+)$/.exec(id);
  if (!m) return null;
  const n = Number(m[2]);
  if (n < 1 || n > LEVELS_PER_STAGE) return null;
  return { stage: m[1] as Stage, n };
}
