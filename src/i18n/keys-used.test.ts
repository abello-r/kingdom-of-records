/**
 * Every translation key written literally in the source must exist, so players never see a raw key.
 * (Keys built dynamically, e.g. `stages.${stage}.name`, are covered by their own tests.)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MESSAGES, lookup } from './index';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

describe('translation keys used in the code', () => {
  const root = join(__dirname, '..');
  const used = new Map<string, 'plain' | 'plural'>();
  for (const file of sourceFiles(root)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\b(t|raw|labelKey:\s*)\(?\s*'([a-z][\w]*(?:\.[\w]+)+)'/g)) used.set(m[2]!, 'plain');
    for (const m of src.matchAll(/\btp\(\s*'([a-z][\w]*(?:\.[\w]+)+)'/g)) used.set(m[1]!, 'plural');
  }

  it('finds the keys', () => {
    expect(used.size).toBeGreaterThan(30);
  });

  it.each(Object.keys(MESSAGES) as (keyof typeof MESSAGES)[])('all exist in %s', (lang) => {
    const missing: string[] = [];
    used.forEach((kind, key) => {
      const keys = kind === 'plural' ? [`${key}.one`, `${key}.other`] : [key];
      for (const k of keys) if (lookup(MESSAGES[lang], k) === undefined) missing.push(k);
    });
    expect(missing).toEqual([]);
  });
});
