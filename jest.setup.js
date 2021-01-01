const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Setup fast-check
const defaultSeedRaw = process.env.DEFAULT_SEED;
if (defaultSeedRaw != null) {
  fc.configureGlobal({ seed: +defaultSeedRaw });
} else if (process.env.CI) {
  throw new Error('Missing env variable for DEFAULT_SEED in CI context');
}
