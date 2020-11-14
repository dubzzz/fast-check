const conf = require('./jest.e2e.config.cjs');

module.exports = Object.assign(conf, {
  testMatch: ['<rootDir>/test/e2e/documentation/**/*.spec.ts'],
});
