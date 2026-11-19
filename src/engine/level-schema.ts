import { LEVELS_PER_STAGE, STAGES, levelId } from '../state/levels';
import { LANGUAGES } from '../state/settings';
import { SPEAKERS, type Level } from './types';

/**
 * Checks that a parsed level JSON has the expected shape and returns it typed.
 * Collects every problem so a broken level file is fixed in one go.
 */
export function parseLevel(raw: unknown, source = 'level'): Level {
  const problems: string[] = [];
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

  if (!isObj(raw)) throw new Error(`${source}: not a JSON object`);
  const r = raw;

  const localized = (v: unknown, path: string): void => {
    if (!isObj(v)) return void problems.push(`${path}: expected { es, en, fr }`);
    for (const lang of LANGUAGES) if (!nonEmpty(v[lang])) problems.push(`${path}.${lang}: missing text`);
  };
  const dialogue = (v: unknown, path: string): void => {
    if (!Array.isArray(v) || v.length === 0) return void problems.push(`${path}: expected a non-empty array`);
    v.forEach((line, i) => {
      if (!isObj(line)) return void problems.push(`${path}[${i}]: expected { speaker, text }`);
      if (!(SPEAKERS as readonly unknown[]).includes(line.speaker)) {
        problems.push(`${path}[${i}].speaker: must be one of ${SPEAKERS.join(', ')}`);
      }
      localized(line.text, `${path}[${i}].text`);
    });
  };

  if (!(STAGES as readonly unknown[]).includes(r.stage)) problems.push(`stage: must be one of ${STAGES.join(', ')}`);
  if (!Number.isInteger(r.order) || (r.order as number) < 1 || (r.order as number) > LEVELS_PER_STAGE) {
    problems.push(`order: must be an integer from 1 to ${LEVELS_PER_STAGE}`);
  }
  if (problems.length === 0 && r.id !== levelId(r.stage as Level['stage'], r.order as number)) {
    problems.push(`id: must be "${r.stage}-${r.order}"`);
  }
  if (!Array.isArray(r.concepts) || r.concepts.length === 0 || !r.concepts.every(nonEmpty)) {
    problems.push('concepts: expected a non-empty array of strings');
  }
  localized(r.title, 'title');
  dialogue(r.narrative, 'narrative');
  localized(r.task, 'task');
  if (!Array.isArray(r.hints) || r.hints.length !== 3) problems.push('hints: expected exactly 3 hints');
  else r.hints.forEach((h, i) => localized(h, `hints[${i}]`));
  dialogue(r.success, 'success');
  if (!nonEmpty(r.setup)) problems.push('setup: missing SQL');
  if (!nonEmpty(r.solution)) problems.push('solution: missing SQL');

  const check = r.check;
  if (!isObj(check)) problems.push('check: missing');
  else if (check.mode === 'result') {
    for (const flag of ['orderMatters', 'ignoreColumnNames'] as const) {
      if (check[flag] !== undefined && typeof check[flag] !== 'boolean') problems.push(`check.${flag}: expected a boolean`);
    }
  } else if (check.mode === 'state') {
    if (!Array.isArray(check.tables) || check.tables.length === 0 || !check.tables.every(nonEmpty)) {
      problems.push('check.tables: expected a non-empty array of table names');
    }
  } else problems.push('check.mode: must be "result" or "state"');

  if (r.examples !== undefined) {
    if (!isObj(r.examples)) problems.push('examples: expected { accepted?, rejected? }');
    else {
      for (const k of ['accepted', 'rejected'] as const) {
        const list = r.examples[k];
        if (list !== undefined && (!Array.isArray(list) || !list.every(nonEmpty))) {
          problems.push(`examples.${k}: expected an array of SQL strings`);
        }
      }
    }
  }

  if (problems.length > 0) throw new Error(`${source} is invalid:\n  - ${problems.join('\n  - ')}`);
  return raw as unknown as Level;
}
