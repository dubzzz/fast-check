import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

// @ts-expect-error - We will fix that one by bumping Vitest to v3
const config: UserConfig = defineConfig({
  test: {
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});
export default config;
