import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.config.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
  },
  coverage: {
    ...rootConfig.coverage,
    enabled: true,
    exclude: ['lib/**', 'test/**'],
    provider: 'istanbul',
    reporter: ['lcov', { projectRoot: './src' }],
  },
});
