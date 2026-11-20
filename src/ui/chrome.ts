import type { I18n } from '../i18n';
import { LANGUAGES, type Language } from '../state/settings';
import { cssUrl, h } from './dom';

export interface ChromeOptions {
  i18n: I18n;
  isMuted: () => boolean;
  isMusicOn: () => boolean;
  onLanguage: (lang: Language) => void;
  /** The speaker: silences everything (music included). */
  onToggleMute: () => void;
  /** The note: music on or off. */
  onToggleMusic: () => void;
  /** Back button target and its accessible label key; omitted on the title screen. */
  back?: { href: string; labelKey: string };
}

/** Shows one of the square kit buttons (ui/btn-<name>.png and its pressed image) on an element. */
function setButtonImage(el: HTMLElement, name: string): void {
  el.style.setProperty('--btn', cssUrl(`ui/btn-${name}.png`));
  el.style.setProperty('--btn-pressed', cssUrl(`ui/btn-${name}-pressed.png`));
}

/**
 * Controls present on every screen: back (top left), language plank `ES · EN · FR`, music and sound
 * (top right). On phones they form a compact solid bar above the scene so no sprite is covered.
 */
export function createChrome(opts: ChromeOptions): { element: HTMLElement; update: () => void } {
  const { i18n } = opts;

  const back = opts.back ? h('a', { class: 'square', href: opts.back.href }) : null;
  if (back) setButtonImage(back, 'back');

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

  // Toggle buttons with a fixed name; aria-pressed says whether the sound or the music is off.
  const music = h('button', { type: 'button', class: 'square' });
  music.addEventListener('click', () => opts.onToggleMusic());
  const mute = h('button', { type: 'button', class: 'square' });
  mute.addEventListener('click', () => opts.onToggleMute());

  const element = h(
    'nav',
    { class: 'chrome' },
    h('div', { class: 'chrome__side' }, back),
    h('div', { class: 'chrome__side' }, plank, music, mute),
  );

  function update(): void {
    element.setAttribute('aria-label', i18n.t('app.title'));
    if (back && opts.back) back.setAttribute('aria-label', i18n.t(opts.back.labelKey));
    plank.setAttribute('aria-label', i18n.t('a11y.languageSelector'));
    langButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(LANGUAGES[i] === i18n.language)));

    const muted = opts.isMuted();
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', i18n.t('sound.muteAll'));
    mute.title = i18n.t(muted ? 'sound.mutedAll' : 'sound.muteAll');
    setButtonImage(mute, muted ? 'sound-off' : 'sound');

    const musicOff = !opts.isMusicOn();
    music.setAttribute('aria-pressed', String(musicOff));
    music.setAttribute('aria-label', i18n.t('sound.muteMusic'));
    music.title = i18n.t(musicOff ? 'sound.mutedMusic' : 'sound.muteMusic');
    setButtonImage(music, musicOff ? 'music-off' : 'music');
    // While everything is silenced the music setting has no effect: show it dimmed.
    music.classList.toggle('is-idle', muted);
  }

  update();
  return { element, update };
}
