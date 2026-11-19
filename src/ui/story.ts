import type { Speaker } from '../engine/types';
import type { I18n } from '../i18n';
import { h, img } from './dom';
import { rich } from './rich';

const PORTRAIT: Partial<Record<Speaker, string>> = {
  aldric: 'portraits/aldric.png',
  scribe: 'portraits/pip.png',
  garrick: 'portraits/garrick.png',
  corvin: 'portraits/corvin.png',
  grubnak: 'portraits/grubnak.png',
};

/**
 * One line of dialogue in the Registry: a bubble with portrait and name, or a narrator caption.
 * `isNew` outlines it (the line that just appeared).
 */
export function dialogue(i18n: I18n, speaker: Speaker, text: string, isNew = false): HTMLElement {
  const body = h('p', {}, rich(text));
  if (speaker === 'narrator') return h('div', { class: `line line--narrator${isNew ? ' line--new' : ''}` }, body);
  const portrait = PORTRAIT[speaker];
  const me = speaker === 'scribe';
  return h(
    'div',
    { class: `line${me ? ' line--me' : ''}${isNew ? ' line--new' : ''}` },
    portrait ? img(portrait, `portrait${me ? ' portrait--flip' : ''}`) : null,
    h('div', { class: 'say' }, h('b', {}, i18n.t(`speakers.${speaker}`)), body),
  );
}
