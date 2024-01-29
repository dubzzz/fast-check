export default {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
};
