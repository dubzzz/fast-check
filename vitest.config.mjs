import { defaultExclude, defineConfig } from 'vitest/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const allProjects = [
  // All packages
  ...readdirSync(join(import.meta.dirname, 'packages'), { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .filter((dir) => dir.name !== 'expect-type' && dir.name !== 'fast-check')
    .map((dir) => join(dir.parentPath, dir.name)),
  // Other directories
  join(import.meta.dirname, 'examples'),
  join(import.meta.dirname, 'website'),
];

const testTimeout = 120_000; // 120s

export default defineConfig({
  test: {
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [...defaultExclude, '**/.test-artifacts/**'],
    testTimeout,
    env: { TEST_TIMEOUT: testTimeout },
    coverage: {
      name: 'fast-check',
      enabled: true,
      include: ['packages/fast-check/src/**'],
    },
    projects: [
      ...allProjects.map((projectPath) => {
        const projectName = JSON.parse(readFileSync(join(projectPath, 'package.json')).toString()).name;
        return {
          extends: true,
          test: {
            root: projectPath,
            name: projectName,
            setupFiles: projectName === 'examples' ? ['vitest.setup.ts'] : [],
          },
        };
      }),
      {
        extends: true,
        test: {
          root: join(import.meta.dirname, 'packages', 'fast-check'),
          name: 'fast-check',
          setupFiles: ['vitest.setup.mjs'],
          include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
        },
      },
      {
        extends: true,
        test: {
          root: join(import.meta.dirname, 'packages', 'fast-check'),
          name: 'fast-check:e2e',
          setupFiles: ['vitest.setup.mjs'],
          include: ['test/e2e/**/*.spec.?(c|m)[jt]s?(x)'],
        },
      },
    ],
  },
});
