import initSqlJs, { type SqlJsStatic } from 'sql.js';

let engine: Promise<SqlJsStatic> | null = null;

/**
 * Loads sql.js (SQLite compiled to WebAssembly) once and caches it.
 * In the browser, pass the URL of the bundled `.wasm` file; in Node (tests) sql.js finds it itself.
 */
export function loadSqlEngine(wasmUrl?: string): Promise<SqlJsStatic> {
  engine ??= initSqlJs({
    // Native SQLite functions instead of the deprecated legacy extension set.
    useOldExtensionFunctions: false,
    ...(wasmUrl ? { locateFile: () => wasmUrl } : {}),
  }).catch((error: unknown) => {
    engine = null; // allow a retry after a failed download
    throw error;
  });
  return engine;
}
