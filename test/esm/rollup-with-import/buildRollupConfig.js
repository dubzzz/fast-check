import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

export default function buildRollupConfig(fileName) {
  return {
    input: fileName,
    output: {
      file: `dist/${fileName}`,
      format: 'iife',
      name: 'RunFastCheck',
    },
    plugins: [resolve(), cjs()],
    onwarn: () => {},
  };
}
