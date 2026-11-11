import { defineConfig } from 'rolldown';

export default defineConfig({
  input: {
    cli: 'src/cli.ts',
    'transforms/v5/asyncProperty': 'src/transforms/v5/asyncProperty.ts',
  },
  output: {
    dir: 'lib',
    format: 'esm',
    entryFileNames: '[name].js',
    cleanDir: true,
  },
  external: /^[^./]/,
});
