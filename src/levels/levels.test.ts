/**
 * Content tests for every level file in /src/levels.
 * Each solution must pass its own validation, and the optional examples must be accepted / rejected.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { SqlJsStatic } from 'sql.js';
import { loadSqlEngine } from '../db/engine';
import { createDatabase, describeSchema } from '../engine/runner';
import { expectedFor, validateAttempt } from '../engine/validate';
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

/**
 * Levels without hidden data, and why. Every other level must have at least one variant so that
 * answers copying values from the visible results are rejected.
 */
const NO_VARIANTS: Record<string, string> = {
  'easy-1': 'returns every row unfiltered: there is no value to copy',
};

it('has hidden variants wherever an answer could be hardcoded', () => {
  const missing = [...levels.values()].filter((l) => !l.variants?.length && !(l.id in NO_VARIANTS)).map((l) => l.id);
  expect(missing).toEqual([]);
});

for (const level of levels.values()) {
  describe(`level ${level.id}`, () => {
    it('has balanced `code` marks in every text', () => {
      for (const [label, text] of texts(level)) {
        expect((text.match(/`/g) ?? []).length % 2, label).toBe(0);
      }
    });

    (level.variants ?? []).forEach((variant, i) => {
      it(`hidden variant ${i + 1} has the same schema and a different, non-empty answer`, () => {
        const schema = (setup: string) => {
          const db = createDatabase(SQL, setup);
          try {
            return describeSchema(db);
          } finally {
            db.close();
          }
        };
        expect(schema(variant)).toEqual(schema(level.setup));

        const visible = expectedFor(SQL, level);
        const hidden = expectedFor(SQL, level, variant);
        expect(JSON.stringify(hidden)).not.toBe(JSON.stringify(visible));
        if (hidden.mode === 'result') expect(hidden.result.rows.length).toBeGreaterThan(0);
      });
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
