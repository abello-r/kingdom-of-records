import { parseLevel } from '../engine/level-schema';
import type { Level } from '../engine/types';
import type { LevelId } from '../state/levels';

/** Every `/src/levels/{stage}-{n}.json` file, bundled at build time. */
const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' });

/** Parses and indexes all level files. Throws if a file is malformed or misnamed. */
export function loadLevels(raw: Record<string, unknown> = files): Map<LevelId, Level> {
  const levels = new Map<LevelId, Level>();
  for (const [path, data] of Object.entries(raw)) {
    const name = path.replace(/^.*\//, '').replace(/\.json$/, '');
    const level = parseLevel(data, path);
    if (level.id !== name) throw new Error(`${path}: id "${level.id}" does not match the file name`);
    levels.set(level.id, level);
  }
  return levels;
}
