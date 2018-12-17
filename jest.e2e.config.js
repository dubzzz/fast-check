module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
  setupFiles: [],
  setupTestFrameworkScriptFile: '<rootDir>/jest.setup.js',
  //setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest'
};
