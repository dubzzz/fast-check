module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['<rootDir>/src/**'],
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  setupFiles: [],
  setupFilesAfterEnv: [],
  preset: 'ts-jest',
};
