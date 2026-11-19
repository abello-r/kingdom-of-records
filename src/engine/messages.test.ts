import { describe, expect, it } from 'vitest';
import { MESSAGES, lookup } from '../i18n';
import { ERROR_KEYS, TIP_KEYS } from './errors';
import { feedbackMessages, mismatchMessage } from './messages';
import type { Mismatch } from './types';

const MISMATCHES: Mismatch[] = [
  { reason: 'noResult' },
  { reason: 'columnCount', expected: 2, actual: 1 },
  { reason: 'columnNames', expected: ['name', 'role'], actual: ['who'] },
  { reason: 'rowCount', expected: 2, actual: 5 },
  { reason: 'rows', missing: 1, unexpected: 1 },
  { reason: 'order' },
  { reason: 'hiddenData' },
  { reason: 'missingTable', table: 'houses' },
  { reason: 'tableColumns', table: 'houses' },
  { reason: 'tableRows', table: 'houses', missing: 1, unexpected: 2 },
];

describe('feedback messages exist in every language', () => {
  const keys = [
    ...ERROR_KEYS.map((k) => `sqlErrors.${k}`),
    ...TIP_KEYS.map((k) => `sqlErrors.tips.${k}`),
    ...MISMATCHES.map((m) => mismatchMessage(m).key),
  ];

  it.each(Object.keys(MESSAGES) as (keyof typeof MESSAGES)[])('%s', (lang) => {
    const missing = keys.filter((key) => lookup(MESSAGES[lang], key) === undefined);
    expect(missing).toEqual([]);
  });

  it('provides every placeholder the message uses', () => {
    for (const m of MISMATCHES) {
      const { key, params } = mismatchMessage(m);
      const text = lookup(MESSAGES.en, key)!;
      for (const [, name] of text.matchAll(/\{(\w+)\}/g)) expect(params, `${key}: {${name}}`).toHaveProperty(name!);
    }
  });
});

describe('feedbackMessages', () => {
  it('lists the error and its tip', () => {
    const lines = feedbackMessages({
      correct: false,
      statements: [],
      error: { key: 'syntaxNear', params: { token: 'SELEC' }, tip: { key: 'didYouMean', params: { keyword: 'SELECT' } }, raw: '' },
    });
    expect(lines.map((l) => l.key)).toEqual(['sqlErrors.syntaxNear', 'sqlErrors.tips.didYouMean']);
  });

  it('is empty for a correct attempt', () => {
    expect(feedbackMessages({ correct: true, statements: [] })).toEqual([]);
  });
});
