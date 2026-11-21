import type { I18n } from '../i18n';
import { h } from './dom';

/** Netlify Forms form name; index.html holds a hidden copy of the form so Netlify detects it at deploy. */
export const SUGGESTIONS_FORM = 'suggestions';
/** Honeypot field: hidden from people, filled in by bots; Netlify drops submissions that have it. */
export const HONEYPOT = 'bot-field';

export interface Suggestion {
  message: string;
  email: string;
  /** Value of the honeypot field: empty for people. */
  trap: string;
  lang: string;
}

/** True on a copy of the game served from this computer, where Netlify Forms does not exist. */
export function isLocalHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]', '::1', ''].includes(hostname) || hostname.endsWith('.local');
}

/**
 * Sends a suggestion to Netlify Forms (a URL-encoded POST to the site root). A filled honeypot means a
 * bot: nothing is sent, but it looks like a success. Resolves to true when the suggestion arrived.
 */
export async function sendSuggestion(s: Suggestion, post: typeof fetch = fetch): Promise<boolean> {
  if (s.trap.trim() !== '') return true;
  const body = new URLSearchParams({ 'form-name': SUGGESTIONS_FORM, message: s.message.trim(), email: s.email.trim(), lang: s.lang, [HONEYPOT]: '' });
  try {
    const res = await post('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    return res.ok;
  } catch {
    return false;
  }
}

/** "Suggestions" link for the footer; it opens a small form in a dialog. */
export function suggestionsLink(i18n: I18n): HTMLElement {
  const t = i18n.t.bind(i18n);
  const open = h('button', { type: 'button', class: 'credits__link' }, t('suggest.link'));

  const message = h('textarea', { id: 'suggest-message', name: 'message', required: true, maxlength: '2000', rows: '5' });
  const email = h('input', { id: 'suggest-email', name: 'email', type: 'email', autocomplete: 'email', maxlength: '200' });
  // Honeypot: kept out of sight, of the keyboard and of screen readers.
  const trap = h('input', { name: HONEYPOT, tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
  const status = h('p', { class: 'suggest__status', role: 'status' });
  const cancel = h('button', { type: 'button', class: 'btn btn--wood' }, t('suggest.cancel'));
  const send = h('button', { type: 'submit', class: 'btn btn--primary' }, t('suggest.send'));
  const form = h('form', { class: 'suggest', name: SUGGESTIONS_FORM },
    h('h2', { id: 'suggest-title' }, t('suggest.title')),
    h('p', { class: 'suggest__intro' }, t('suggest.intro')),
    isLocalHost(location.hostname) ? h('p', { class: 'suggest__local' }, t('suggest.local')) : null,
    h('label', { for: 'suggest-message' }, t('suggest.message')),
    message,
    h('label', { for: 'suggest-email' }, t('suggest.email')),
    email,
    h('p', { class: 'suggest__trap' }, h('label', {}, 'Leave this empty', trap)),
    status,
    h('div', { class: 'confirm__actions' }, cancel, send));
  const dialog = h('dialog', { class: 'paper confirm', 'aria-labelledby': 'suggest-title' }, form);

  const reset = () => {
    form.reset();
    status.textContent = '';
    send.disabled = false;
    send.textContent = t('suggest.send');
    form.classList.remove('is-sent');
  };
  open.addEventListener('click', () => {
    reset();
    dialog.showModal();
    message.focus();
  });
  cancel.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.classList.contains('is-sent')) {
      dialog.close();
      return;
    }
    send.disabled = true;
    send.textContent = t('suggest.sending');
    status.textContent = '';
    const ok = await sendSuggestion({ message: message.value, email: email.value, trap: trap.value, lang: i18n.language });
    send.disabled = false;
    if (ok) {
      // Only the thanks and a button to close are left.
      form.classList.add('is-sent');
      status.textContent = t('suggest.thanks');
      send.textContent = t('suggest.close');
      send.focus();
    } else {
      status.textContent = t('suggest.error');
      send.textContent = t('suggest.send');
    }
  });
  return h('span', { class: 'credits__suggest' }, open, dialog);
}
