import type { SqlClient } from '../engine/client';
import type { AttemptResult, Level } from '../engine/types';
import type { I18n } from '../i18n';
import type { LevelMemory } from '../state/level-memory';
import type { LevelId } from '../state/levels';
import type { Progress } from '../state/progress';
import type { Settings } from '../state/settings';
import type { Route } from './router';

/** What a level remembers while the page is open (e.g. across a language change). */
export interface LevelSession {
  result?: AttemptResult;
  solvedNow?: boolean;
}

/** Shared services handed to every screen. */
export interface AppContext {
  i18n: I18n;
  progress: Progress;
  memory: LevelMemory;
  settings: Settings;
  levels: Map<LevelId, Level>;
  sql: SqlClient;
  sessions: Map<LevelId, LevelSession>;
  navigate(route: Route, opts?: { replace?: boolean }): void;
  /** Controls bar (back, language, sound) for the current screen. */
  chrome(back?: { href: string; labelKey: string }): HTMLElement;
}

export interface Screen {
  element: HTMLElement;
  /** Document title for this screen. */
  title: string;
  /** Element that receives focus after navigation (defaults to the main landmark). */
  focus?: HTMLElement;
  destroy?(): void;
}
