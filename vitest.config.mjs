import { coverageConfigDefaults, defaultExclude, defineConfig } from 'vitest/config';
import { readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

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

export default defineConfig({
  test: {
    include: ['**/test/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [...defaultExclude, '**/.test-artifacts/**'],
    testTimeout: 120000, // 120s
    projects: [
      ...allProjects.map((projectPath) => {
        const projectName = basename(projectPath);
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
          setupFiles: ['vitest.setup.ts'],
          include: ['test/unit/**/*.spec.?(c|m)[jt]s?(x)'],
          coverage: {
            name: 'fast-check',
            enabled: true,
            include: ['src/**'],
            exclude: ['lib/**', 'test/**', ...coverageConfigDefaults.exclude],
          },
        },
      },
      {
        extends: true,
        test: {
          root: join(import.meta.dirname, 'packages', 'fast-check'),
          name: 'fast-check:e2e',
          setupFiles: ['vitest.setup.ts'],
          include: ['test/e2e/**/*.spec.?(c|m)[jt]s?(x)'],
        },
      },
    ],
  },
});
