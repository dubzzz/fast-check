import buildConfigFor from '../../rolldown.common.config.js';
import pkg from './package.json' with { type: 'json' };
import { execSync } from 'child_process';

function getCommitHash() {
  const gitHubCommitHash = process.env.GITHUB_SHA && process.env.GITHUB_SHA.split('\n')[0];
  if (gitHubCommitHash) {
    console.info(`Using env variable GITHUB_SHA for the commit hash, got: ${gitHubCommitHash}`);
    return gitHubCommitHash;
  }
  if (process.env.EXPECT_GITHUB_SHA) {
    if (!gitHubCommitHash) {
      console.error('No GITHUB_SHA specified');
      process.exit(1);
    }
  }
  const out = execSync('git rev-parse HEAD');
  return out.toString().split('\n')[0];
}

export default buildConfigFor(pkg, import.meta.dirname, (isESM) => ({
  preventAssignment: true,
  'process.env.__PACKAGE_TYPE__': isESM ? JSON.stringify('module') : JSON.stringify('commonjs'),
  'process.env.__PACKAGE_VERSION__': JSON.stringify(pkg.version),
  'process.env.__COMMIT_HASH__': JSON.stringify(getCommitHash()),
}));
