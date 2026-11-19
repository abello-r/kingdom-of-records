import type { I18n } from '../i18n';
import { LANGUAGES, type Language } from '../state/settings';
import { ICONS, h, icon, img } from './dom';

export interface ChromeOptions {
  i18n: I18n;
  isMuted: () => boolean;
  onLanguage: (lang: Language) => void;
  onToggleMute: () => void;
  /** Back button target and its accessible label key; omitted on the title screen. */
  back?: { href: string; labelKey: string };
}

/**
 * Controls present on every screen: back (top left), language plank `ES · EN · FR` and sound
 * (top right). On phones they form a compact solid bar above the scene so no sprite is covered.
 */
export function createChrome(opts: ChromeOptions): { element: HTMLElement; update: () => void } {
  const { i18n } = opts;

  const back = opts.back ? h('a', { class: 'round', href: opts.back.href }, img('ui/icon-back.png')) : null;

  const langButtons = LANGUAGES.map((lang) => {
    const btn = h('button', { type: 'button', lang }, lang.toUpperCase());
    btn.addEventListener('click', () => opts.onLanguage(lang));
    return btn;
  });
  const plank = h('div', { class: 'lang', role: 'group' });
  langButtons.forEach((btn, i) => {
    if (i > 0) plank.append(h('span', { class: 'sep', 'aria-hidden': 'true' }, '·'));
    plank.append(btn);
  });

  const mute = h('button', { type: 'button', class: 'round' });
  mute.addEventListener('click', () => opts.onToggleMute());

  const element = h(
    'nav',
    { class: 'chrome' },
    h('div', { class: 'chrome__side' }, back),
    h('div', { class: 'chrome__side' }, plank, mute),
  );

  function update(): void {
    element.setAttribute('aria-label', i18n.t('app.title'));
    if (back && opts.back) back.setAttribute('aria-label', i18n.t(opts.back.labelKey));
    plank.setAttribute('aria-label', i18n.t('a11y.languageSelector'));
    langButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(LANGUAGES[i] === i18n.language)));
    const muted = opts.isMuted();
    const label = i18n.t(muted ? 'sound.unmute' : 'sound.mute');
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', label);
    mute.title = label;
    mute.replaceChildren(icon(muted ? [ICONS.speaker, ICONS.cross] : [ICONS.speaker, ICONS.waves]));
  }

  update();
  return { element, update };
}
