module.exports = {
  plugins: [['@babel/plugin-transform-modules-commonjs', { importInterop: 'node' }]],
  presets: ['@babel/preset-react', '@babel/preset-typescript'],
};
