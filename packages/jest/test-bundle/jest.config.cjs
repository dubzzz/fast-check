module.exports = {
  testMatch: ['<rootDir>/*.spec.cjs'],
  testTimeout: 20_000,
  transform: {
    '^.+\\.(js|jsx|ts|tsx|cjs|mjs)$': 'babel-jest'
  },
  transformIgnorePatterns: [],
};
