import { readJson, type KeyValueStore } from './storage';

export const SETTINGS_KEY = 'kor.settings.v1';

export const LANGUAGES = ['es', 'en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Picks the first supported language from the browser preferences, English otherwise. */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return 'en';
}

export interface Settings {
  language: Language;
  /** Silences everything: effects and music (the speaker button). */
  muted: boolean;
  /** Background music on or off (the note button); has no effect while `muted`. */
  music: boolean;
}

export function loadSettings(store: KeyValueStore, browserLanguages: readonly string[]): Settings {
  const data = readJson(store, SETTINGS_KEY) as Partial<Settings> | null;
  return {
    language: isLanguage(data?.language) ? data.language : detectLanguage(browserLanguages),
    muted: typeof data?.muted === 'boolean' ? data.muted : false,
    music: typeof data?.music === 'boolean' ? data.music : true,
  };
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.set(SETTINGS_KEY, JSON.stringify(settings));
}
