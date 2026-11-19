import { describe, expect, it } from 'vitest';
import { loadLevels } from '../levels';
import { parseLevel } from './level-schema';
import { makeLevel } from './test-fixtures';

describe('parseLevel', () => {
  it('accepts a valid level', () => {
    const level = makeLevel();
    expect(parseLevel(JSON.parse(JSON.stringify(level)))).toEqual(level);
  });

  it('lists every problem of an invalid level', () => {
    const broken = {
      ...makeLevel(),
      id: 'easy-2',
      title: { es: 'Hola', en: '' },
      hints: [],
      narrative: [{ speaker: 'king', text: { es: 'a', en: 'b', fr: 'c' } }],
      check: { mode: 'magic' },
    };
    let message = '';
    try {
      parseLevel(broken, 'easy-1.json');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('easy-1.json is invalid');
    expect(message).toContain('id: must be "easy-1"');
    expect(message).toContain('title.en: missing text');
    expect(message).toContain('title.fr: missing text');
    expect(message).toContain('hints: expected exactly 3 hints');
    expect(message).toContain('narrative[0].speaker');
    expect(message).toContain('check.mode');
  });

  it('requires table names for state checks', () => {
    expect(() => parseLevel({ ...makeLevel(), check: { mode: 'state', tables: [] } })).toThrow(/check.tables/);
  });
});

describe('loadLevels', () => {
  it('checks that ids match file names', () => {
    expect(() => loadLevels({ './easy-2.json': makeLevel() })).toThrow(/does not match the file name/);
    expect(loadLevels({ './easy-1.json': makeLevel() }).get('easy-1')?.id).toBe('easy-1');
  });
});
