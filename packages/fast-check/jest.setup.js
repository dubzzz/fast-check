const process = require('process');
const fc = require('fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Setup fast-check
const defaultSeedRaw = process.env.DEFAULT_SEED;
if (defaultSeedRaw != null) {
  fc.configureGlobal({ seed: +defaultSeedRaw });
} else if (process.env.EXPECT_DEFAULT_SEED || process.env.GITHUB_ACTION) {
  throw new Error('Missing env variable for DEFAULT_SEED in CI context');
}
