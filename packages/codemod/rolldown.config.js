import { defineConfig } from 'rolldown';
import { readdirSync } from 'node:fs';

const transforms = readdirSync('src/transforms', { recursive: true })
  .filter((file) => file.endsWith('.ts'))
  .map((file) => file.replaceAll('\\', '/'))
  .sort();

export default defineConfig({
  input: {
    cli: 'src/cli.ts',
    ...Object.fromEntries(transforms.map((file) => [`transforms/${file.slice(0, -3)}`, `src/transforms/${file}`])),
  },
  output: {
    dir: 'lib',
    format: 'esm',
    entryFileNames: '[name].js',
    cleanDir: true,
  },
  external: /^[^./]/,
});
