import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import type { Language } from '../state/settings';

export type Messages = typeof en;

export const MESSAGES: Record<Language, Messages> = { es, en, fr };

/** Value of a dotted key (`"home.intro"`) in a messages tree, if it is a string. */
export function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Replaces `{name}` placeholders. Unknown placeholders are left as they are. */
export function interpolate(text: string, params: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** CLDR plural category for the supported languages (French treats 0 as singular). */
export function pluralForm(lang: Language, count: number): 'one' | 'other' {
  if (lang === 'fr') return count === 0 || count === 1 ? 'one' : 'other';
  return count === 1 ? 'one' : 'other';
}

type Listener = (lang: Language) => void;

export class I18n {
  private listeners = new Set<Listener>();

  constructor(private lang: Language) {}

  get language(): Language {
    return this.lang;
  }

  setLanguage(lang: Language): void {
    if (lang === this.lang) return;
    this.lang = lang;
    this.listeners.forEach((fn) => fn(lang));
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Translates a key; falls back to English, then to the key itself so gaps are visible. */
  t(key: string, params?: Record<string, string | number>): string {
    return interpolate(this.raw(key), params);
  }

  /** Untranslated template (placeholders kept), for callers that render rich parameters. */
  raw(key: string): string {
    return lookup(MESSAGES[this.lang], key) ?? lookup(MESSAGES.en, key) ?? key;
  }

  /** Plural-aware translation: uses `key.one` / `key.other` and provides `{count}`. */
  tp(key: string, count: number, params: Record<string, string | number> = {}): string {
    return this.t(`${key}.${pluralForm(this.lang, count)}`, { ...params, count });
  }
}
