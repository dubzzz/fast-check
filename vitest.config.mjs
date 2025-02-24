import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      name: 'fast-check',
      enabled: true,
      include: ['**/src/**'],
      exclude: ['**/lib/**', '**/test/**'],
    },
  },
});
