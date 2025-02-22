import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

// @ts-expect-error - We will fix that one by bumping Vitest to v3
const config: UserConfig = defineConfig({
  test: {
    name: 'unit',
  },
});
export default config;
