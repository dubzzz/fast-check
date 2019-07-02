import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
  input: 'test/rollup/iife/main.js',
  output: {
    file: 'test/rollup/iife/dist/main.js',
    format: 'iife',
    name: 'RunFastCheck'
  },
  plugins: [resolve(), cjs()],
  onwarn: warning => {
    throw warning;
  }
};
