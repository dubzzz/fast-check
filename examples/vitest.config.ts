import { defineConfig } from 'vitest/config';

export const VitestTimeoutMs = 120000; // 120s

export default defineConfig({
  test: {
    testTimeout: VitestTimeoutMs,
    setupFiles: ['vitest.setup.ts'],
  },
});
