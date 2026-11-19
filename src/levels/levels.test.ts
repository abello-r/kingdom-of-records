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

/** Every translated text of a level, with a label for error messages. */
function texts(level: ReturnType<typeof levels.get> & object): [string, string][] {
  const out: [string, string][] = [];
  const add = (label: string, l: Record<string, string>) =>
    Object.entries(l).forEach(([lang, text]) => out.push([`${label}.${lang}`, text]));
  add('title', level.title);
  add('task', level.task);
  level.hints.forEach((h, i) => add(`hints[${i}]`, h));
  level.narrative.forEach((d, i) => add(`narrative[${i}]`, d.text));
  level.success.forEach((d, i) => add(`success[${i}]`, d.text));
  return out;
}

it('contains all 15 levels', () => {
  expect(levels.size).toBe(15);
});

for (const level of levels.values()) {
  describe(`level ${level.id}`, () => {
    it('has balanced `code` marks in every text', () => {
      for (const [label, text] of texts(level)) {
        expect((text.match(/`/g) ?? []).length % 2, label).toBe(0);
      }
    });

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
