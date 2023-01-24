module.exports = {
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsConfig: 'tsconfig.json' }],
  },
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
};
