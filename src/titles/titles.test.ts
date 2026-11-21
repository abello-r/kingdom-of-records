import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../app/site';
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import { STAGES } from '../state/levels';
import { linkedinShareUrl, shareUrl, TITLES } from './titles';

const LANGS = ['es', 'en', 'fr'] as const;
const I18N = { es, en, fr };

describe('titles', () => {
  it('has one title per stage, with a name and texts in every language', () => {
    expect(TITLES.map((t) => t.stage)).toEqual([...STAGES]);
    for (const t of TITLES) {
      for (const lang of LANGS) {
        expect(t.name[lang]?.trim(), `${t.id}.${lang}`).toBeTruthy();
        const texts = I18N[lang].title;
        expect(texts.for[t.id as keyof typeof texts.for], `for.${t.id}.${lang}`).toBeTruthy();
        expect(texts.text[t.id as keyof typeof texts.text], `text.${t.id}.${lang}`).toContain('{url}');
        expect(texts.imageSub[t.id as keyof typeof texts.imageSub], `imageSub.${t.id}.${lang}`).toBeTruthy();
      }
    }
  });

  it('links to its own share page and LinkedIn share dialog', () => {
    expect(shareUrl('castle', 'fr')).toBe(`${SITE_URL}/share/castle/fr/`);
    expect(linkedinShareUrl('apprentice', 'es')).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${SITE_URL}/share/apprentice/es/`)}`,
    );
  });
});
