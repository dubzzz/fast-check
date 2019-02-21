const conf = require('./jest.config');

module.exports = Object.assign(conf, {
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts']
});
