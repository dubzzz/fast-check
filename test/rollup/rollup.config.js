import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
  input: 'test/rollup/main.js',
  output: {
    file: 'test/rollup/dist/main.js',
    format: 'iife',
    name: 'RunFastCheck'
  },
  plugins: [resolve(), cjs()]
};
