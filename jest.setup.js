const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Use GITHUB_RUN_ID + GITHUB_ACTION as default seed
const runId = process.env.GITHUB_RUN_ID;
const action = process.env.GITHUB_ACTION;
if (runId != null && action != null) {
  const runIdValue = +runId
  const actionValue = +action;
  fc.configureGlobal({ seed: runIdValue + actionValue });
}
