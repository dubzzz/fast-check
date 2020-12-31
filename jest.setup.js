const process = require('process');
const fc = require('./lib/fast-check');

// Default timeout of 120s
jest.setTimeout(120000);

// Use GITHUB_RUN_ID + CONTAINER as default seed
const runId = process.env.GITHUB_RUN_ID;
const container = process.env.CONTAINER;
if (runId != null && container != null) {
  const runIdValue = +runId
  const containerValue = +container;
  fc.configureGlobal({ seed: runIdValue + containerValue });
}
