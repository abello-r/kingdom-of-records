import { beforeAll, describe, expect, it } from 'vitest';
import type { SqlJsStatic } from 'sql.js';
import { loadSqlEngine } from '../db/engine';
import { createDatabase, describeSchema } from '../engine/runner';
import { loadLevels } from '../levels';
import { SQLITE_KEYWORDS, levelDialect } from './sql-dialect';
import { typeKey } from './sql-types';

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await loadSqlEngine();
});

describe('SQLite dialect for the editor', () => {
  it('uses the real SQLite keyword list', () => {
    expect(SQLITE_KEYWORDS).toHaveLength(147);
    expect(SQLITE_KEYWORDS).toContain('select');
    expect(SQLITE_KEYWORDS).not.toContain('role');
  });

  it("never treats the level's own names as keywords", () => {
    const words = levelDialect(['key', 'villagers']).spec.keywords!.split(' ');
    expect(words).not.toContain('key');
    expect(words).toContain('select');
  });

  it('no table or column of any level (visible or hidden data) is an SQLite keyword', () => {
    const clashes: string[] = [];
    for (const level of loadLevels().values()) {
      for (const setup of [level.setup, ...(level.variants ?? [])]) {
        const db = createDatabase(SQL, setup);
        for (const table of describeSchema(db)) {
          for (const name of [table.name, ...table.columns.map((c) => c.name)]) {
            if (SQLITE_KEYWORDS.includes(name.toLowerCase())) clashes.push(`${level.id}: ${name}`);
          }
        }
        db.close();
      }
    }
    expect(clashes).toEqual([]);
  });
});

describe('typeKey', () => {
  it('follows SQLite type affinity', () => {
    expect(typeKey('INTEGER')).toBe('integer');
    expect(typeKey('int')).toBe('integer');
    expect(typeKey('TEXT')).toBe('text');
    expect(typeKey('VARCHAR(20)')).toBe('text');
    expect(typeKey('REAL')).toBe('real');
    expect(typeKey('BLOB')).toBe('blob');
    expect(typeKey('')).toBeNull();
  });
});
