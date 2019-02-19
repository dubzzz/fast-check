// Shared Jest configuration
// Useful for Jest plugin of vscode

module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest'
};
