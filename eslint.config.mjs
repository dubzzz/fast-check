// @ts-check
// Minimal ESLint config for type-aware rules only.
// All non-type-aware linting is handled by oxlint.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    files: ['packages/*/src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
    },
  },
  {
    ignores: [
      '.github/',
      'node_modules/',
      'coverage/',
      'examples/',
      'packages/*/coverage/',
      'packages/*/docs/',
      'packages/*/dist/',
      'packages/*/lib/',
      'packages/*/lib-*/',
      'packages/*/rolldown.config.js',
      'packages/**/.test-artifacts/',
      'rolldown.common.config.js',
      'website/',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.js',
    ],
  },
);
