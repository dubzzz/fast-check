import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const config: UserConfig = defineConfig({
  test: {
    testTimeout: 60000, // 60s
    include: ['**/docs/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
      // Default exclusion list taken from:
      // https://vitest.dev/config/#exclude
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      // Added exclusion
      '**/.test-artifacts/**',
    ],
  },
});
export default config;
