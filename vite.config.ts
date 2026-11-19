/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works from any static host or sub-folder.
  base: './',
  build: {
    target: 'es2022',
  },
  worker: {
    // The SQL worker imports modules (sql.js, engine code), so it must be an ES module worker.
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
