module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  setupTestFrameworkScriptFile: '<rootDir>/jest.setup.js',
  //setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/test/', '<rootDir>/node_modules/']
};
