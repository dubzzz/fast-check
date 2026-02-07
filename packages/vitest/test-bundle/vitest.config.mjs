import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['test-bundle/main.spec.mjs'],
  },
});
