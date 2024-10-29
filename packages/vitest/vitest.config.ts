import { defineConfig } from 'vitest/config';

const major = Number(process.versions.node.split('.')[0]);

export default defineConfig({
  test: {
    testTimeout: 60000, // 60s
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
    retry: major === 23 ? 5 : undefined,
  },
});
