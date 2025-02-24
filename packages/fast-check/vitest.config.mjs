import { defineConfig } from 'vitest/config';

import rootConfig from './vitest.shared.mjs';

export default defineConfig({
  ...rootConfig,
  test: {
    ...rootConfig.test,
    include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
