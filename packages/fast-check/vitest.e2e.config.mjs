import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.shared.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    name: 'fast-check:e2e',
    include: ['test/e2e/**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
