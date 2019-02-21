const conf = require('./jest.config');

module.exports = Object.assign(conf, {
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/test/', '<rootDir>/node_modules/']
});
