import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 120000, // 120s
    setupFiles: ['vitest.setup.mjs'],
  },
});
