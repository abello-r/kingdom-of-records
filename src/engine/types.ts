import type { LevelId, Stage } from '../state/levels';
import type { Language } from '../state/settings';

/** A text in every supported language. */
export type Localized = Record<Language, string>;

/** Characters that can speak in level dialogues (see docs/STORY.md). */
export const SPEAKERS = ['narrator', 'aldric', 'scribe', 'garrick', 'corvin', 'grubnak'] as const;
export type Speaker = (typeof SPEAKERS)[number];

export interface DialogueLine {
  speaker: Speaker;
  text: Localized;
}

/**
 * How an attempt is checked.
 * - `result`: the last result set of the player's SQL must match the solution's (columns + rows).
 *   Row order is ignored unless `orderMatters` is true.
 *   Column names are compared case- and whitespace-insensitively; set `ignoreColumnNames` when the
 *   level does not ask for specific names (e.g. aggregates without aliases).
 * - `state`: after running the player's SQL, the listed tables must contain exactly the same rows as
 *   after running the solution (row order ignored).
 */
export type CheckSpec =
  | { mode: 'result'; orderMatters?: boolean; ignoreColumnNames?: boolean }
  | { mode: 'state'; tables: string[] };

export interface Level {
  id: LevelId;
  stage: Stage;
  /** Position inside the stage, 1-based. */
  order: number;
  /** SQL concepts taught, e.g. ["SELECT", "WHERE"]. */
  concepts: string[];
  title: Localized;
  /** Story shown before the task. */
  narrative: DialogueLine[];
  /** What the player must do, stated plainly. */
  task: Localized;
  /** Exactly three progressive hints, from gentle to almost the answer. */
  hints: [Localized, Localized, Localized];
  /** Story shown after solving the level. */
  success: DialogueLine[];
  /** Schema + seed data, run on a fresh database before every attempt. */
  setup: string;
  /** Reference solution. */
  solution: string;
  check: CheckSpec;
  /** Test-only: other queries that must be accepted and common mistakes that must be rejected. */
  examples?: { accepted?: string[]; rejected?: string[] };
}

export type SqlValue = number | string | Uint8Array | null;

export interface ResultSet {
  columns: string[];
  rows: SqlValue[][];
}

/** Outcome of one statement of the player's SQL, in execution order. */
export type StatementOutcome =
  | { kind: 'rows'; sql: string; result: ResultSet }
  | { kind: 'changes'; sql: string; changes: number };

export interface TableSnapshot {
  name: string;
  columns: string[];
  rows: SqlValue[][];
}

export interface SqlErrorInfo {
  /** i18n key under `sqlErrors.*`. */
  key: string;
  params: Record<string, string>;
  /** Optional extra advice, i18n key under `sqlErrors.tips.*`. */
  tip?: { key: string; params: Record<string, string> };
  /** Original SQLite message, for curious players and debugging. */
  raw: string;
}

/** Why an attempt is not accepted. Mapped to friendly messages by the UI. */
export type Mismatch =
  | { reason: 'noResult' }
  | { reason: 'columnCount'; expected: number; actual: number }
  | { reason: 'columnNames'; expected: string[]; actual: string[] }
  | { reason: 'rowCount'; expected: number; actual: number }
  | { reason: 'rows'; missing: number; unexpected: number }
  | { reason: 'order' }
  | { reason: 'missingTable'; table: string }
  | { reason: 'tableColumns'; table: string }
  | { reason: 'tableRows'; table: string; missing: number; unexpected: number };

export interface AttemptResult {
  /** True when the attempt solves the level. */
  correct: boolean;
  /** Set when the SQL could not run. */
  error?: SqlErrorInfo;
  /** Set when the SQL ran but the answer is not right. */
  mismatch?: Mismatch;
  /** Every statement executed before an error (or all of them). */
  statements: StatementOutcome[];
  /** Final content of the checked tables (state levels only), for display. */
  tables?: TableSnapshot[];
}
