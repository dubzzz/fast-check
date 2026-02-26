module.exports = {
  testMatch: ['<rootDir>/*.spec.cjs'],
  testTimeout: 20_000,
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(?:@fast-check/worker)/)'],
};
