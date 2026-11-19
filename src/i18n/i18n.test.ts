import { describe, expect, it } from 'vitest';
import { I18n, MESSAGES, interpolate } from './index';

/** All dotted keys whose value is a string. */
function keys(tree: unknown, prefix = ''): string[] {
  if (typeof tree === 'string') return [prefix];
  if (tree === null || typeof tree !== 'object') return [];
  return Object.entries(tree).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
}

describe('i18n catalogues', () => {
  const reference = keys(MESSAGES.en).sort();

  it.each(['es', 'fr'] as const)('%s has exactly the same keys as en', (lang) => {
    expect(keys(MESSAGES[lang]).sort()).toEqual(reference);
  });

  it.each(['es', 'en', 'fr'] as const)('%s has no empty strings', (lang) => {
    const t = new I18n(lang);
    for (const key of reference) expect(t.t(key).trim(), key).not.toBe('');
  });

  it.each(['es', 'fr'] as const)('%s keeps the same placeholders as en', (lang) => {
    const en = new I18n('en');
    const other = new I18n(lang);
    for (const key of reference) {
      expect(placeholders(other.t(key)), key).toEqual(placeholders(en.t(key)));
    }
  });
});

describe('I18n', () => {
  it('translates, interpolates and notifies language changes', () => {
    const i18n = new I18n('en');
    const seen: string[] = [];
    i18n.onChange((lang) => seen.push(lang));

    expect(i18n.t('home.progress', { done: 2, total: 15 })).toBe('2 of 15 levels completed');
    i18n.setLanguage('es');
    expect(i18n.t('stages.easy.name')).toBe('La Aldea en Cenizas');
    i18n.setLanguage('es'); // same language: no event
    expect(seen).toEqual(['es']);
  });

  it('returns the key for unknown entries so gaps are visible', () => {
    expect(new I18n('fr').t('does.not.exist')).toBe('does.not.exist');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});
