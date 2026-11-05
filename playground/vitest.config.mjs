import { defineConfig } from 'vitest/config';

// Keep this example independent of the repository's Vitest projects.
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
  },
});
