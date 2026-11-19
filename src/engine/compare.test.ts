import { describe, expect, it } from 'vitest';
import { canonicalValue, compareResults, compareTables, normalizeColumnName } from './compare';
import type { ResultSet } from './types';

const expected: ResultSet = {
  columns: ['name', 'role'],
  rows: [
    ['Wren', 'archer'],
    ['Bram', 'archer'],
  ],
};

describe('compareResults', () => {
  it('accepts the same rows in any order when order does not matter', () => {
    expect(compareResults(expected, { columns: ['name', 'role'], rows: [['Bram', 'archer'], ['Wren', 'archer']] })).toBeNull();
  });

  it('requires the order when asked', () => {
    const swapped = { columns: ['name', 'role'], rows: [['Bram', 'archer'], ['Wren', 'archer']] };
    expect(compareResults(expected, swapped, { orderMatters: true })).toEqual({ reason: 'order' });
    expect(compareResults(expected, expected, { orderMatters: true })).toBeNull();
  });

  it('accepts reordered columns and ignores case, spaces and quotes in names', () => {
    expect(compareResults(expected, { columns: ['ROLE', '"Name"'], rows: [['archer', 'Wren'], ['archer', 'Bram']] })).toBeNull();
  });

  it('reports wrong column names unless names are ignored', () => {
    const renamed = { columns: ['who', 'what'], rows: expected.rows };
    expect(compareResults(expected, renamed)).toEqual({
      reason: 'columnNames',
      expected: ['name', 'role'],
      actual: ['who', 'what'],
    });
    expect(compareResults(expected, renamed, { ignoreColumnNames: true })).toBeNull();
  });

  it('reports missing results, column count, row count and wrong rows', () => {
    expect(compareResults(expected, undefined)).toEqual({ reason: 'noResult' });
    expect(compareResults(expected, { columns: ['name'], rows: [['Wren'], ['Bram']] })).toEqual({
      reason: 'columnCount',
      expected: 2,
      actual: 1,
    });
    expect(compareResults(expected, { columns: ['name', 'role'], rows: [['Wren', 'archer']] })).toEqual({
      reason: 'rowCount',
      expected: 2,
      actual: 1,
    });
    expect(
      compareResults(expected, { columns: ['name', 'role'], rows: [['Wren', 'archer'], ['Pip', 'pawn']] }),
    ).toEqual({ reason: 'rows', missing: 1, unexpected: 1 });
  });

  it('treats duplicates as a multiset', () => {
    const dup = { columns: ['name', 'role'], rows: [['Wren', 'archer'], ['Wren', 'archer']] };
    expect(compareResults(expected, dup)).toEqual({ reason: 'rows', missing: 1, unexpected: 1 });
  });

  it('accepts an empty result when none is expected', () => {
    const empty = { columns: ['name', 'role'], rows: [] };
    expect(compareResults(empty, empty)).toBeNull();
  });

  it('compares numbers by value with float tolerance, and keeps types apart', () => {
    const avg = { columns: ['avg'], rows: [[0.1 + 0.2]] };
    expect(compareResults({ columns: ['avg'], rows: [[0.3]] }, avg)).toBeNull();
    expect(compareResults({ columns: ['n'], rows: [[5]] }, { columns: ['n'], rows: [[5.0]] })).toBeNull();
    expect(compareResults({ columns: ['n'], rows: [[5]] }, { columns: ['n'], rows: [['5']] })).not.toBeNull();
    expect(compareResults({ columns: ['n'], rows: [[null]] }, { columns: ['n'], rows: [[null]] })).toBeNull();
  });
});

describe('compareTables', () => {
  const houses = { name: 'houses', columns: ['id', 'status'], rows: [[1, 'rebuilt'], [2, 'burnt']] };

  it('ignores row order', () => {
    const actual = { ...houses, rows: [[2, 'burnt'], [1, 'rebuilt']] };
    expect(compareTables(['houses'], [houses], [actual])).toBeNull();
  });

  it('reports missing tables, changed columns and different rows', () => {
    expect(compareTables(['houses'], [houses], [null])).toEqual({ reason: 'missingTable', table: 'houses' });
    expect(compareTables(['houses'], [houses], [{ ...houses, columns: ['id', 'state'] }])).toEqual({
      reason: 'tableColumns',
      table: 'houses',
    });
    expect(compareTables(['houses'], [houses], [{ ...houses, rows: [[1, 'burnt'], [2, 'burnt']] }])).toEqual({
      reason: 'tableRows',
      table: 'houses',
      missing: 1,
      unexpected: 1,
    });
  });
});

describe('helpers', () => {
  it('normalizes column names and values', () => {
    expect(normalizeColumnName(' SUM( gold ) ')).toBe('sum(gold)');
    expect(normalizeColumnName('[Total]')).toBe('total');
    expect(canonicalValue(new Uint8Array([1, 255]))).toBe('b:01ff');
  });
});
