import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.shared.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    coverage: {
      ...rootConfig.test.coverage,
      name: 'fast-check',
      enabled: true,
      include: ['src/**'],
      exclude: ['lib/**', 'test/**'],
    },
    include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
