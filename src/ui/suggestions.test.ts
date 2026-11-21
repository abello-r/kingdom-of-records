import { describe, expect, it, vi } from 'vitest';
import { HONEYPOT, sendSuggestion, SUGGESTIONS_FORM } from './suggestions';

const ok = () => vi.fn(async () => ({ ok: true }) as Response);

describe('sendSuggestion', () => {
  it('posts the form to Netlify, URL-encoded, with the form name', async () => {
    const post = ok();
    expect(await sendSuggestion({ message: '  More levels!  ', email: 'a@b.c', trap: '', lang: 'es' }, post)).toBe(true);
    const [url, init] = post.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded');
    const body = new URLSearchParams(String(init.body));
    expect(Object.fromEntries(body)).toEqual({ 'form-name': SUGGESTIONS_FORM, message: 'More levels!', email: 'a@b.c', lang: 'es', [HONEYPOT]: '' });
  });

  it('sends nothing when the honeypot is filled, but looks like a success to the bot', async () => {
    const post = ok();
    expect(await sendSuggestion({ message: 'spam', email: '', trap: 'http://spam', lang: 'en' }, post)).toBe(true);
    expect(post).not.toHaveBeenCalled();
  });

  it('reports a failure when the server refuses or the network fails', async () => {
    expect(await sendSuggestion({ message: 'x', email: '', trap: '', lang: 'fr' }, vi.fn(async () => ({ ok: false }) as Response))).toBe(false);
    expect(await sendSuggestion({ message: 'x', email: '', trap: '', lang: 'fr' }, vi.fn(async () => Promise.reject(new Error('offline'))))).toBe(false);
  });
});
