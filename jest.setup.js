const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Use GITHUB_RUN_ID as default seed
if (process.env.GITHUB_RUN_ID) {
  fc.configureGlobal({ seed: +process.env.GITHUB_RUN_ID });
}
