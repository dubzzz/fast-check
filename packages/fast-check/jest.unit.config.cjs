const conf = require('./jest.config.cjs');

module.exports = Object.assign(conf, {
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/test/'],
});
