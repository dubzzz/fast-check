import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.config.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    coverage: {
      ...rootConfig.test.coverage,
      enabled: true,
      include: ['src/**'],
      exclude: ['lib/**', 'test/**'],
    },
    include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
