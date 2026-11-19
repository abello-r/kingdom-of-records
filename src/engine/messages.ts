import type { AttemptResult, Mismatch } from './types';

export interface Message {
  key: string;
  params: Record<string, string | number>;
}

/** i18n message for a mismatch (keys under `mismatch.*`). */
export function mismatchMessage(m: Mismatch): Message {
  const key = `mismatch.${m.reason}`;
  switch (m.reason) {
    case 'columnNames':
      return { key, params: { expected: m.expected.join(', '), actual: m.actual.join(', ') } };
    case 'noResult':
    case 'order':
      return { key, params: {} };
    default: {
      const { reason: _reason, ...params } = m;
      return { key, params };
    }
  }
}

/**
 * Feedback lines for a failed attempt, most important first:
 * an SQL error (plus an optional tip), or why the answer is not right yet. Empty when correct.
 */
export function feedbackMessages(result: AttemptResult): Message[] {
  if (result.error) {
    const lines: Message[] = [{ key: `sqlErrors.${result.error.key}`, params: result.error.params }];
    if (result.error.tip) lines.push({ key: `sqlErrors.tips.${result.error.tip.key}`, params: result.error.tip.params });
    return lines;
  }
  if (result.mismatch) return [mismatchMessage(result.mismatch)];
  return [];
}
