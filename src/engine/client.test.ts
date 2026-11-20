// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SqlClient } from './client';
import type { Level } from './types';

/** Delays (ms) the fake worker takes for each request type; `never` means it never answers. */
const delays: Record<string, number | 'never'> = {};
let workers = 0;

class FakeWorker {
  private listener?: (event: { data: unknown }) => void;
  terminated = false;
  constructor() {
    workers++;
  }
  addEventListener(type: string, listener: (event: { data: unknown }) => void) {
    if (type === 'message') this.listener = listener;
  }
  postMessage(msg: { id: number; type: string }) {
    const delay = delays[msg.type] ?? 0;
    if (delay === 'never') return;
    setTimeout(() => {
      if (this.terminated) return;
      const value = msg.type === 'validate' ? { correct: true, statements: [] } : true;
      this.listener?.({ data: { id: msg.id, ok: true, value } });
    }, delay);
  }
  terminate() {
    this.terminated = true;
  }
}

const level = {} as Level;

describe('SqlClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Worker', FakeWorker);
    workers = 0;
    for (const k of Object.keys(delays)) delete delays[k];
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('gives a slow engine download its own time, so the first query is not reported as too slow', async () => {
    delays.warmup = 5000; // e.g. a phone on a poor connection
    const client = new SqlClient('sql.wasm', 3000);
    const warm = client.warmup();
    const attempt = client.validate(level, 'SELECT 1');
    await vi.advanceTimersByTimeAsync(5100);
    await expect(warm).resolves.toBeUndefined();
    await expect(attempt).resolves.toEqual({ correct: true, statements: [] });
    expect(workers).toBe(1);
  });

  it('still stops a query that runs too long once the engine is loaded', async () => {
    delays.validate = 'never';
    const client = new SqlClient('sql.wasm', 3000);
    const warm = client.warmup();
    await vi.advanceTimersByTimeAsync(10);
    await warm;
    const attempt = client.validate(level, 'WITH RECURSIVE x AS (SELECT 1 UNION ALL SELECT 1 FROM x) SELECT * FROM x');
    await vi.advanceTimersByTimeAsync(3100);
    await expect(attempt).resolves.toMatchObject({ correct: false, error: { key: 'timeout' } });

    // The next attempt uses a fresh worker that loads the engine again.
    delays.validate = 0;
    const next = client.validate(level, 'SELECT 1');
    await vi.advanceTimersByTimeAsync(10);
    await expect(next).resolves.toMatchObject({ correct: true });
    expect(workers).toBe(2);
  });

  it('reports an engine that cannot load as an error, not as a slow query', async () => {
    delays.warmup = 'never';
    const client = new SqlClient('sql.wasm', 3000);
    const attempt = client.validate(level, 'SELECT 1');
    const check = expect(attempt).rejects.toThrow('Query timed out');
    await vi.advanceTimersByTimeAsync(61000);
    await check;
  });
});
