// eslint-disable-next-line
const path = require('path');

// eslint-disable-next-line
module.exports = function buildWebpackConfig(fileName) {
  return {
    mode: 'production',
    entry: {
      app: `./${fileName}`,
    },
    plugins: [],
    output: {
      filename: fileName,
      // eslint-disable-next-line
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      fallback: { querystring: require.resolve('querystring-es3') },
    },
  };
};
