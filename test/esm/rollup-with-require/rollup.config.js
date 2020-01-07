import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

export default {
  input: 'main.js',
  output: {
    file: 'dist/main.js',
    format: 'iife',
    name: 'RunFastCheck'
  },
  plugins: [resolve(), cjs()],
  onwarn: () => {}
};
