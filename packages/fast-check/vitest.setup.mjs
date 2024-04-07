import process from 'process';
import fc from 'fast-check';

// Setup fast-check
const defaultSeedRaw = process.env.DEFAULT_SEED;
if (defaultSeedRaw != null) {
  fc.configureGlobal({ seed: +defaultSeedRaw });
} else if (process.env.EXPECT_DEFAULT_SEED || process.env.GITHUB_ACTION) {
  throw new Error('Missing env variable for DEFAULT_SEED in CI context');
}
