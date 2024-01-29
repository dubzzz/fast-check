export default {
  resolver: 'jest-ts-webcompat-resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
};
