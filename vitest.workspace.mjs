import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'examples/vitest.config.*',
  'packages/*/vitest.config.*',
  'packages/*/vitest.*.config.*',
  'website/vitest.config.*',
]);
