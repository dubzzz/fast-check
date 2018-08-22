import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
  input: 'test/rollup/main.js',
  output: {
    file: 'test/rollup/dist/main.js',
    format: 'cjs'
  },
  plugins: [ resolve(), cjs() ],

  // (!) Unresolved dependencies -- os (imported by node_modules\lorem-ipsum\lib\generator.js,  commonjs-external:os)
  external: [ 'os' ],
  // (!) `this` has been rewritten to `undefined`
  onwarn: function ({code, message}) {
    if (code === 'THIS_IS_UNDEFINED') return;
    console.error(message);
  }
};
