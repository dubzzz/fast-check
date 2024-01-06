import conf from './jest.config.js';

export default Object.assign(conf, {
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
  testPathIgnorePatterns:
    typeof BigInt === 'undefined' ? ['/NoRegressionBigInt.spec.ts', '/documentation/Docs.md.spec.ts'] : [],
});
