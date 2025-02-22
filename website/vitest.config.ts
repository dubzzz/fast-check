import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const major = Number(process.versions.node.split('.')[0]);

// @ts-expect-error - We will fix that one by bumping Vitest to v3
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
    retry: major === 23 ? 5 : undefined,
  },
});
export default config;
