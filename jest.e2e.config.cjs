const conf = require('./jest.config.cjs');

module.exports = Object.assign(conf, {
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
  testPathIgnorePatterns:
    typeof BigInt === 'undefined' ? ['/NoRegressionBigInt.spec.ts', '/documentation/Docs.md.spec.ts'] : [],
});
