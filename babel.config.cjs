module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Don't add polyfills automatically per file, and don't transform import "core-js"
        // or import "@babel/polyfill" to individual polyfills.
        useBuiltIns: false,
        // This option is useful for "blacklisting" a transform like @babel/plugin-transform-regenerator
        // if you don't use generators and don't want to include regeneratorRuntime (when using useBuiltIns)
        exclude: ['@babel/plugin-transform-regenerator'],
      },
    ],
    '@babel/preset-typescript',
  ],
};
