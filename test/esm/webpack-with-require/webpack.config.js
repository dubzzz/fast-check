// eslint-disable-next-line
const path = require('path');

// eslint-disable-next-line
module.exports = {
  mode: 'production',
  entry: {
    app: './main.js'
  },
  plugins: [],
  output: {
    filename: 'main.js',
    // eslint-disable-next-line
    path: path.resolve(__dirname, 'dist')
  }
};
