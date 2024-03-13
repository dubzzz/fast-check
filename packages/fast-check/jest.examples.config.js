import conf from './jest.e2e.config.js';

export default Object.assign(conf, {
  testMatch: ['<rootDir>/test/e2e/documentation/**/*.spec.ts'],
});
