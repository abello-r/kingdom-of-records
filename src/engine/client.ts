import type { SchemaTable } from './runner';
import type { AttemptResult, Level } from './types';
import type { WorkerRequest, WorkerResponse } from './worker';

/** Default time a player's query may run before it is stopped. */
export const DEFAULT_TIMEOUT_MS = 3000;

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: number };

/** Distributes Omit over the request union (plain Omit would collapse it). */
type Payload = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id' | 'wasmUrl'> : never) : never;

export class TimeoutError extends Error {
  constructor() {
    super('Query timed out');
    this.name = 'TimeoutError';
  }
}

/**
 * Main-thread facade over the SQL worker. If a request exceeds the timeout the worker is terminated
 * (stopping the query) and a fresh one is started for the next request.
 */
export class SqlClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor(
    private readonly wasmUrl: string,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  private getWorker(): Worker {
    if (!this.worker) {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.ok) p.resolve(msg.value);
        else p.reject(new Error(msg.error));
      });
      worker.addEventListener('error', (event) => this.failAll(new Error(event.message || 'SQL worker error')));
      this.worker = worker;
    }
    return this.worker;
  }

  private failAll(error: Error): void {
    this.pending.forEach((p) => {
      clearTimeout(p.timer);
      p.reject(error);
    });
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  private request<T>(payload: Payload): Promise<T> {
    const id = this.nextId++;
    const worker = this.getWorker();
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => this.failAll(new TimeoutError()), this.timeoutMs);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      worker.postMessage({ ...payload, id, wasmUrl: this.wasmUrl } as WorkerRequest);
    });
  }

  /** Loads the engine in the worker ahead of time so the first attempt is instant. */
  async warmup(): Promise<void> {
    await this.request<boolean>({ type: 'warmup' });
  }

  /** Checks an attempt. A query that runs too long is reported as a `timeout` SQL error. */
  async validate(level: Level, sql: string): Promise<AttemptResult> {
    try {
      return await this.request<AttemptResult>({ type: 'validate', level, sql });
    } catch (error) {
      if (error instanceof TimeoutError) {
        return {
          correct: false,
          error: { key: 'timeout', params: { seconds: String(this.timeoutMs / 1000) }, raw: error.message },
          statements: [],
        };
      }
      throw error;
    }
  }

  /** Tables and columns of a level, for autocompletion and the schema panel. */
  schema(level: Level): Promise<SchemaTable[]> {
    return this.request<SchemaTable[]>({ type: 'schema', level });
  }

  dispose(): void {
    this.failAll(new Error('SQL client disposed'));
  }
}
