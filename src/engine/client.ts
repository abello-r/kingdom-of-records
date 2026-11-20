import type { SchemaTable } from './runner';
import type { AttemptResult, Level } from './types';
import type { WorkerRequest, WorkerResponse } from './worker';

/** Default time a player's query may run before it is stopped. */
export const DEFAULT_TIMEOUT_MS = 3000;
/**
 * Time allowed to download and start the SQL engine (about 650 KB of WebAssembly). Much longer than a
 * query, so a slow connection is not mistaken for a runaway query.
 */
export const LOAD_TIMEOUT_MS = 60000;

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
 * Main-thread facade over the SQL worker. The engine is loaded first, with its own generous timeout;
 * then each query gets `timeoutMs`. If a request exceeds its timeout the worker is terminated
 * (stopping the query) and a fresh one, which loads the engine again, is started for the next request.
 */
export class SqlClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  /** Resolves once the current worker has loaded the engine. */
  private ready: Promise<void> | null = null;

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
    this.ready = null;
  }

  private post<T>(payload: Payload, timeoutMs: number): Promise<T> {
    const id = this.nextId++;
    const worker = this.getWorker();
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => this.failAll(new TimeoutError()), timeoutMs);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      worker.postMessage({ ...payload, id, wasmUrl: this.wasmUrl } as WorkerRequest);
    });
  }

  private ensureReady(): Promise<void> {
    this.ready ??= this.post<boolean>({ type: 'warmup' }, LOAD_TIMEOUT_MS).then(
      () => undefined,
      (error: unknown) => {
        this.ready = null; // try again on the next request
        throw error;
      },
    );
    return this.ready;
  }

  /** Waits for the engine, then runs the request with the query timeout. */
  private async request<T>(payload: Payload): Promise<T> {
    await this.ensureReady();
    return this.post<T>(payload, this.timeoutMs);
  }

  /** Loads the engine in the worker ahead of time so the first attempt is instant. */
  warmup(): Promise<void> {
    return this.ensureReady();
  }

  /**
   * Checks an attempt. A query that runs too long is reported as a `timeout` SQL error; an engine that
   * cannot load rejects (shown as an engine error, not as a slow query).
   */
  async validate(level: Level, sql: string): Promise<AttemptResult> {
    await this.ensureReady();
    try {
      return await this.post<AttemptResult>({ type: 'validate', level, sql }, this.timeoutMs);
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
