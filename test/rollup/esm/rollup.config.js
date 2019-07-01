import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
  input: 'test/rollup/esm/main.js',
  output: {
    file: 'test/rollup/esm/dist/main.js',
    format: 'iife',
    name: 'RunFastCheck'
  },
  plugins: [resolve(), cjs()],
  onwarn: warning => {
    if (warning.code !== 'THIS_IS_UNDEFINED') throw warning;
  }
};
