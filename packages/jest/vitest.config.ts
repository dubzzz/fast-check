import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000, // 60s
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
