import { defineConfig } from 'rolldown';

export default defineConfig({
  input: {
    cli: 'src/cli.ts',
    'transforms/v5/no-asyncProperty': 'src/transforms/v5/no-asyncProperty.ts',
  },
  output: {
    dir: 'lib',
    format: 'cjs',
    entryFileNames: '[name].cjs',
    cleanDir: true,
  },
  external: /^[^./]/,
});
