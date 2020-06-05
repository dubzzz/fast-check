import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';

export default function buildRollupConfig(fileName) {
  return {
    input: fileName,
    output: {
      file: `dist/${fileName}`,
      format: 'iife',
      name: 'RunFastCheck',
    },
    plugins: [builtins(), resolve(), cjs()],
    onwarn: () => {},
  };
}
