import conf from './jest.config.js';

export default Object.assign(conf, {
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/test/'],
});
