import { describe, expect, it } from 'vitest';
import { doubleQuotedTokens, doubleQuotedValues } from './lint';

describe('doubleQuotedTokens', () => {
  it('finds double-quoted tokens and handles escapes', () => {
    expect(doubleQuotedTokens('SELECT "name" FROM t WHERE role = "arch""er"')).toEqual(['name', 'arch"er']);
  });

  it('ignores single-quoted texts and comments', () => {
    const sql = `SELECT 'say "hi"' -- "comment"\nFROM t /* "block" */ WHERE x = 'it''s "fine"'`;
    expect(doubleQuotedTokens(sql)).toEqual([]);
  });

  it('copes with unterminated input', () => {
    expect(doubleQuotedTokens('SELECT "abc')).toEqual(['abc']);
    expect(doubleQuotedTokens("SELECT 'abc")).toEqual([]);
  });
});

describe('doubleQuotedValues', () => {
  const known = ['villagers', 'name', 'role'];

  it('reports texts written with double quotes, once each', () => {
    expect(doubleQuotedValues('SELECT name FROM villagers WHERE role = "archer" OR role = "archer"', known)).toEqual(['archer']);
  });

  it('accepts double quotes around real table and column names (any case)', () => {
    expect(doubleQuotedValues('SELECT "Name" FROM "villagers"', known)).toEqual([]);
  });
});
