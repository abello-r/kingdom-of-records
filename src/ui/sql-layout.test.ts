import { describe, expect, it } from 'vitest';
import { loadLevels } from '../levels';
import { isSqlBlock, layoutSql } from './sql-layout';

/** Every code snippet in every hint of every level, in the three languages. */
const LEVELS_FOR_TEST = [...loadLevels().values()].flatMap((level) =>
  level.hints.flatMap((hint) => Object.values(hint).flatMap((text: string) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]!))),
);

describe('layoutSql', () => {
  it('puts one statement and one clause per line', () => {
    expect(layoutSql("INSERT INTO scribes (name, sworn_on) VALUES ('Pip', '1247-03-16'); UPDATE houses SET status = 'rebuilt' WHERE ...;")).toBe(
      [
        'INSERT INTO scribes (name, sworn_on)',
        "VALUES ('Pip', '1247-03-16');",
        'UPDATE houses',
        "SET status = 'rebuilt'",
        'WHERE ...;',
      ].join('\n'),
    );
  });

  it('keeps DELETE FROM together and splits joins', () => {
    expect(layoutSql("DELETE FROM merchants WHERE seal = 'none';")).toBe("DELETE FROM merchants\nWHERE seal = 'none';");
    expect(layoutSql('SELECT s.item FROM stolen_goods s LEFT JOIN recoveries r ON r.stolen_id = s.id WHERE ...;')).toBe(
      'SELECT s.item\nFROM stolen_goods s\nLEFT JOIN recoveries r ON r.stolen_id = s.id\nWHERE ...;',
    );
    expect(layoutSql('SELECT a FROM t JOIN u ON u.id = t.id JOIN v ON ...')).toBe('SELECT a\nFROM t\nJOIN u ON u.id = t.id\nJOIN v ON ...');
  });

  it('breaks out long subqueries with indentation and keeps short ones inline', () => {
    expect(layoutSql("SELECT MAX(total) FROM (SELECT SUM(quantity) AS total FROM supplies WHERE item = 'TNT' GROUP BY camp)")).toBe(
      ['SELECT MAX(total)', 'FROM (', '  SELECT SUM(quantity) AS total', '  FROM supplies', "  WHERE item = 'TNT'", '  GROUP BY camp', ')'].join('\n'),
    );
    expect(layoutSql('SELECT name, loot_value FROM goblins WHERE loot_value > (SELECT ... FROM goblins);')).toBe(
      'SELECT name, loot_value\nFROM goblins\nWHERE loot_value > (SELECT ... FROM goblins);',
    );
  });

  it('never changes quoted text', () => {
    expect(layoutSql("SELECT name FROM villagers WHERE note = 'from where they group by'")).toBe(
      "SELECT name\nFROM villagers\nWHERE note = 'from where they group by'",
    );
  });

  it('keeps every character of the original snippet apart from spacing', () => {
    for (const code of LEVELS_FOR_TEST) {
      expect(layoutSql(code).replace(/\s+/g, '')).toBe(code.replace(/\s+/g, ''));
    }
  });
});

describe('isSqlBlock', () => {
  it('is true for whole queries and false for short pieces', () => {
    expect(isSqlBlock('UPDATE table SET column = value WHERE condition;')).toBe(true);
    expect(isSqlBlock('ORDER BY last_seen_at DESC')).toBe(false);
    expect(isSqlBlock("trade IN ('woodcutter', 'miner')")).toBe(false);
    expect(isSqlBlock('SELECT name, role FROM ...;')).toBe(false);
  });
});
