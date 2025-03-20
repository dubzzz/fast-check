import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const config: UserConfig = defineConfig({
  test: {
    testTimeout: 60000, // 60s
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
export default config;
