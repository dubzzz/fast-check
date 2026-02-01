import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/calculator.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/*integration.spec.ts', // Run with Playwright
      '**/*property-based.spec.ts', // Run with Playwright
      '**/*stateful.spec.ts', // Run with Playwright
    ],
  },
});
