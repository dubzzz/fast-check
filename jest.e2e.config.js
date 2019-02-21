const conf = require('./jest.config');

module.exports = {
  ...conf,
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts']
};
