import type { I18n } from '../i18n';
import { LANGUAGES, type Language } from '../state/settings';
import { ICONS, h, icon } from './dom';

export interface HeaderOptions {
  i18n: I18n;
  isMuted: () => boolean;
  onLanguage: (lang: Language) => void;
  onToggleMute: () => void;
}

/** Top bar, present on every screen: title, language selector (ES · EN · FR) and mute toggle. */
export function createHeader(opts: HeaderOptions): { element: HTMLElement; update: () => void } {
  const { i18n } = opts;

  const title = h('span', { class: 'brand__title' });
  const subtitle = h('span', { class: 'brand__subtitle' });

  const langButtons = LANGUAGES.map((lang) => {
    const btn = h('button', { type: 'button', class: 'lang-switch__btn', lang }, lang.toUpperCase());
    btn.addEventListener('click', () => opts.onLanguage(lang));
    return btn;
  });
  const langGroup = h('div', { class: 'lang-switch', role: 'group' });
  langButtons.forEach((btn, i) => {
    if (i > 0) langGroup.append(h('span', { class: 'lang-switch__sep', 'aria-hidden': 'true' }, '·'));
    langGroup.append(btn);
  });

  const muteBtn = h('button', { type: 'button', class: 'icon-btn mute-btn' });
  muteBtn.addEventListener('click', () => opts.onToggleMute());

  const element = h(
    'header',
    { class: 'top-bar' },
    h('div', { class: 'brand' }, title, subtitle),
    h('div', { class: 'top-bar__controls' }, langGroup, muteBtn),
  );

  function update(): void {
    title.textContent = i18n.t('app.title');
    subtitle.textContent = i18n.t('app.subtitle');
    langGroup.setAttribute('aria-label', i18n.t('a11y.languageSelector'));
    langButtons.forEach((btn, i) => {
      btn.setAttribute('aria-pressed', String(LANGUAGES[i] === i18n.language));
    });

    const muted = opts.isMuted();
    const label = i18n.t(muted ? 'sound.unmute' : 'sound.mute');
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', label);
    muteBtn.title = label;
    muteBtn.replaceChildren(icon(muted ? [ICONS.speaker, ICONS.cross] : [ICONS.speaker, ICONS.waves]));
  }

  update();
  return { element, update };
}
