import { defaultExclude, defineConfig } from 'vitest/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const allProjects = [
  // All packages
  ...readdirSync(join(import.meta.dirname, 'packages'), { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .filter((dir) => dir.name !== 'expect-type')
    .map((dir) => join(dir.parentPath, dir.name)),
  // Other directories
  join(import.meta.dirname, 'examples'),
  join(import.meta.dirname, 'website'),
];

const testTimeout = 120_000; // 120s

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [...defaultExclude, '**/.test-artifacts/**', '**/templates/*-tutorial/**'],
    coverage: { include: ['packages/fast-check/src/**'] },
    testTimeout,
    env: { TEST_TIMEOUT: testTimeout },
    projects: allProjects.map((projectPath) => {
      const projectName = JSON.parse(readFileSync(join(projectPath, 'package.json')).toString()).name;
      return {
        extends: true,
        test: {
          root: projectPath,
          name: projectName,
          setupFiles:
            projectName === 'examples' ? ['vitest.setup.ts'] : projectName === 'fast-check' ? ['vitest.setup.mjs'] : [],
        },
      };
    }),
  },
});
