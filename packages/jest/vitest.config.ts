import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 120000, // 120s
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
