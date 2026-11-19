import { describe, expect, it } from 'vitest';
import { segments } from './rich';

describe('segments', () => {
  it('turns backticks into code', () => {
    expect(segments('Use `WHERE` here.')).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'code', text: 'WHERE' },
      { kind: 'text', text: ' here.' },
    ]);
  });

  it('shows SQL parameters as code and others as text', () => {
    expect(segments('No column called {column} in {stage}.', { column: 'nme', stage: 'Easy' })).toEqual([
      { kind: 'text', text: 'No column called ' },
      { kind: 'code', text: 'nme' },
      { kind: 'text', text: ' in Easy.' },
    ]);
  });

  it("keeps the quotes of '{param}' inside the chip", () => {
    expect(segments("write it as '{value}'.", { value: 'archer' })).toEqual([
      { kind: 'text', text: 'write it as ' },
      { kind: 'code', text: "'archer'" },
      { kind: 'text', text: '.' },
    ]);
  });

  it('keeps counts as plain text even for code parameters', () => {
    expect(segments('Expected: {expected}', { expected: 2 })).toEqual([{ kind: 'text', text: 'Expected: 2' }]);
    expect(segments('Expected: {expected}', { expected: 'name, role' })[1]).toEqual({ kind: 'code', text: 'name, role' });
  });

  it('leaves unknown placeholders visible', () => {
    expect(segments('{missing} here')).toEqual([{ kind: 'text', text: '{missing} here' }]);
  });
});
