const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Use GITHUB_RUN_ID + GITHUB_RUN_NUMBER as default seed
const runId = process.env.GITHUB_RUN_ID;
const runNumber = process.env.GITHUB_RUN_NUMBER;
if (runId != null && runNumber != null) {
  const runIdValue = +runId
  const runNumberValue = +runNumber;
  fc.configureGlobal({ seed: runIdValue + runNumberValue });
}
