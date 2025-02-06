import { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const major = Number(process.versions.node.split('.')[0]);

const config: UserConfig = defineConfig({
  test: {
    testTimeout: 60000, // 60s
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
    retry: major === 23 ? 5 : undefined,
  },
});
export default config;
