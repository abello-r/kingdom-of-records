import type { SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSqlEngine } from '../db/engine';
import { createDatabase } from '../engine/runner';
import { loadLevels } from '../levels';
import { ALL_LEVELS } from '../state/levels';
import { SPELLS } from './spells';

const levels = loadLevels();
let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await loadSqlEngine();
});

describe('spell book', () => {
  it('has unique spells in game order, each tied to an existing level', () => {
    expect(new Set(SPELLS.map((s) => s.id)).size).toBe(SPELLS.length);
    const order = SPELLS.map((s) => ALL_LEVELS.indexOf(s.level));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    for (const s of SPELLS) expect(levels.has(s.level), s.id).toBe(true);
  });

  it('has every text in Spanish, English and French', () => {
    for (const s of SPELLS) {
      for (const field of [s.name, s.what, s.formula]) {
        for (const lang of ['es', 'en', 'fr'] as const) expect(field[lang]?.trim(), `${s.id}.${lang}`).toBeTruthy();
      }
    }
  });

  it('runs every example on the data of the level where it is learned', () => {
    for (const s of SPELLS) {
      const level = levels.get(s.level)!;
      const db = createDatabase(SQL, level.setup);
      try {
        expect(() => db.exec(s.example), s.id).not.toThrow();
        if (/^\s*SELECT/i.test(s.example)) expect(db.exec(s.example)[0]?.values.length ?? 0, `${s.id} returns rows`).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    }
  });

  it('teaches something new on every level but the final challenge', () => {
    const taught = new Set(SPELLS.map((s) => s.level));
    for (const id of ALL_LEVELS) if (id !== 'hard-5') expect(taught.has(id), id).toBe(true);
  });
});
