// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: './tsconfig.common.json',
      },
    },
  },
  {
    rules: {
      // Rules not in any preset
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-use-before-define': 'warn',
      'require-atomic-updates': 'error',

      // Relaxed from preset defaults
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',

      // Customized options
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
    },
  },
  {
    files: [
      '**/*.cjs',
      '**/cjs/**/*.js',
      'packages/ava/test/ava-specs/testProp.js',
      '**/ava.config.js',
      '**/jest.config.js',
      'packages/packaged/bin/*.js',
    ],
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.mjs', '**/mjs/**/*.js'],
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/test/unit/**/*.ts',
      '**/test/e2e/**/*.ts',
      '**/test-types/**/*.ts',
      '**/test-types/**/*.mts',
    ],
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      ...tseslint.configs.disableTypeChecked.rules,
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
    ],
  },
];
