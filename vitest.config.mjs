import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      name: 'fast-check',
      enabled: true,
      include: ['packages/fast-check/src/**'],
      exclude: ['packages/fast-check/lib/**', 'packages/fast-check/test/**'],
    },
  },
});
