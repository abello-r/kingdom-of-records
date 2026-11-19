import { describe, expect, it } from 'vitest';
import { SETTINGS_KEY, detectLanguage, loadSettings, saveSettings } from './settings';
import { createMemoryStore } from './storage';

describe('settings', () => {
  it('detects the first supported browser language', () => {
    expect(detectLanguage(['fr-CA', 'en-US'])).toBe('fr');
    expect(detectLanguage(['de-DE', 'es-ES'])).toBe('es');
    expect(detectLanguage(['de-DE'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('uses detected language and sound on by default', () => {
    expect(loadSettings(createMemoryStore(), ['es-ES'])).toEqual({ language: 'es', muted: false });
  });

  it('round-trips saved settings and ignores invalid values', () => {
    const store = createMemoryStore();
    saveSettings(store, { language: 'fr', muted: true });
    expect(loadSettings(store, ['es'])).toEqual({ language: 'fr', muted: true });

    store.set(SETTINGS_KEY, JSON.stringify({ language: 'xx', muted: 'yes' }));
    expect(loadSettings(store, ['es'])).toEqual({ language: 'es', muted: false });
  });
});
