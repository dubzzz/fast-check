import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.shared.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    name: 'fast-check:documentation',
    include: ['test/e2e/documentation/**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
