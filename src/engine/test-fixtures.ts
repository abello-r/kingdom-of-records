/** Test helpers: minimal valid levels built in code (not shipped as game content). */
import type { Level, Localized } from './types';

export const text = (s: string): Localized => ({ es: `${s} (es)`, en: s, fr: `${s} (fr)` });

export const VILLAGE_SETUP = `
CREATE TABLE villagers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, age INTEGER);
INSERT INTO villagers (name, role, age) VALUES
  ('Pip', 'pawn', 17), ('Aldric', 'warrior', 63), ('Wren', 'archer', 24),
  ('Bram', 'archer', 31), ('Tilda', 'monk', 45);
CREATE TABLE houses (id INTEGER PRIMARY KEY, owner TEXT, status TEXT);
INSERT INTO houses (owner, status) VALUES ('Pip', 'burnt'), ('Wren', 'rebuilding'), ('Bram', 'burnt');
`;

export function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'easy-1',
    stage: 'easy',
    order: 1,
    concepts: ['SELECT'],
    title: text('Title'),
    narrative: [{ speaker: 'aldric', text: text('Story') }],
    task: text('Task'),
    hints: [text('Hint 1'), text('Hint 2'), text('Hint 3')],
    success: [{ speaker: 'aldric', text: text('Well done') }],
    setup: VILLAGE_SETUP,
    solution: "SELECT name, role FROM villagers WHERE role = 'archer';",
    check: { mode: 'result' },
    ...overrides,
  };
}
