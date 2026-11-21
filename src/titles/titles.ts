import { SITE_URL } from '../app/site';
import type { Localized } from '../engine/types';
import type { Language } from '../state/settings';
import type { Stage } from '../state/levels';
import data from './titles.json';

/**
 * Titles earned at the end of each stage (the last one after the epilogue). titles.json is shared with
 * scripts/build_share.py, which makes the share pages (/share/<id>/<lang>/) and their 1200x630 images.
 */
export type TitleId = 'apprentice' | 'castle' | 'high';

export interface Title {
  id: TitleId;
  stage: Stage;
  /** Pages of the Registry completed when the title is earned. */
  pages: number;
  ribbon: 'blue' | 'purple' | 'red';
  name: Localized;
  /** SQL ideas shown on the certificate and the share image. */
  chips: (string | Localized)[];
}

export const TITLES = data as Title[];

export function isTitleId(value: unknown): value is TitleId {
  return TITLES.some((t) => t.id === value);
}

export function titleFor(stage: Stage): Title | undefined {
  return TITLES.find((t) => t.stage === stage);
}

export function chipText(chip: string | Localized, lang: Language): string {
  return typeof chip === 'string' ? chip : chip[lang];
}

/** The page to share for a title: its own preview image and texts, then it opens the game. */
export function shareUrl(id: TitleId, lang: Language): string {
  return `${SITE_URL}/share/${id}/${lang}/`;
}

/** Path of the title's 1200x630 image, relative to the site root (used for "Download image"). */
export function shareImagePath(id: TitleId, lang: Language): string {
  return `share/${id}/${lang}/og.png`;
}

export function linkedinShareUrl(id: TitleId, lang: Language): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl(id, lang))}`;
}
