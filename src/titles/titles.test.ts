import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../app/site';
import es from '../i18n/es.json';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import { STAGES } from '../state/levels';
import { linkedinShareUrl, shareImagePath, shareUrl, TITLES } from './titles';

const LANGS = ['es', 'en', 'fr'] as const;
const I18N = { es, en, fr };
const PUBLIC = join(__dirname, '..', '..', 'public');

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

  it('has a generated share page and 1200x630 image per title and language (scripts/build_share.py)', () => {
    for (const t of TITLES) {
      for (const lang of LANGS) {
        const dir = join(PUBLIC, 'share', t.id, lang);
        const page = readFileSync(join(dir, 'index.html'), 'utf8');
        expect(page).toContain(`<meta property="og:url" content="${shareUrl(t.id, lang)}" />`);
        expect(page).toContain(`<meta property="og:image" content="${shareUrl(t.id, lang)}og.png" />`);
        expect(page).toContain(`url=../../../?lang=${lang}`);
        expect(page).toContain(t.name[lang].replace(/&/g, '&amp;'));
        expect(existsSync(join(PUBLIC, shareImagePath(t.id, lang)))).toBe(true);
        const png = readFileSync(join(PUBLIC, shareImagePath(t.id, lang)));
        expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
      }
    }
  });
});
