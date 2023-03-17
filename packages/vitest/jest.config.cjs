module.exports = {
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  preset: 'ts-jest',
  testPathIgnorePatterns: ['/generated-tests/'],
};
