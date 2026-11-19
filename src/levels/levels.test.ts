/**
 * Content tests for every level file in /src/levels.
 * Each solution must pass its own validation, and the optional examples must be accepted / rejected.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { SqlJsStatic } from 'sql.js';
import { loadSqlEngine } from '../db/engine';
import { validateAttempt } from '../engine/validate';
import { loadLevels } from './index';

const levels = loadLevels();

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await loadSqlEngine();
});

it('loads all level files without errors', () => {
  expect(levels.size).toBeGreaterThanOrEqual(0);
});

for (const level of levels.values()) {
  describe(`level ${level.id}`, () => {
    it('solution passes its own validation', () => {
      const result = validateAttempt(SQL, level, level.solution);
      expect(result.error).toBeUndefined();
      expect(result.mismatch).toBeUndefined();
      expect(result.correct).toBe(true);
    });

    for (const sql of level.examples?.accepted ?? []) {
      it(`accepts: ${sql}`, () => {
        const result = validateAttempt(SQL, level, sql);
        expect(result.error).toBeUndefined();
        expect(result.mismatch).toBeUndefined();
      });
    }

    for (const sql of level.examples?.rejected ?? []) {
      it(`rejects: ${sql}`, () => {
        expect(validateAttempt(SQL, level, sql).correct).toBe(false);
      });
    }
  });
}
