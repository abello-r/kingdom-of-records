/**
 * Runs the SQL engine off the main thread so a runaway query (e.g. an endless recursive CTE) cannot
 * freeze the page: the client terminates this worker after a timeout.
 */
import { loadSqlEngine } from '../db/engine';
import { createDatabase, describeSchema } from './runner';
import type { Level } from './types';
import { validateAttempt } from './validate';

export type WorkerRequest =
  | { id: number; type: 'warmup'; wasmUrl: string }
  | { id: number; type: 'validate'; wasmUrl: string; level: Level; sql: string }
  | { id: number; type: 'schema'; wasmUrl: string; level: Level };

export type WorkerResponse = { id: number; ok: true; value: unknown } | { id: number; ok: false; error: string };

const scope = self as unknown as {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
};

scope.addEventListener('message', async (event) => {
  const req = event.data;
  try {
    const SQL = await loadSqlEngine(req.wasmUrl);
    let value: unknown;
    if (req.type === 'warmup') {
      value = true;
    } else if (req.type === 'validate') {
      value = validateAttempt(SQL, req.level, req.sql);
    } else {
      const db = createDatabase(SQL, req.level.setup);
      try {
        value = describeSchema(db);
      } finally {
        db.close();
      }
    }
    scope.postMessage({ id: req.id, ok: true, value });
  } catch (error) {
    scope.postMessage({ id: req.id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
