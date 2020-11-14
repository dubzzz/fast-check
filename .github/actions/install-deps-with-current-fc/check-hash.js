// eslint-disable-next-line
const { exec } = require('child_process');
const { exit } = require('process');
const path = require('path');
const { __commit_hash } = require(path.join(__dirname, '..', '..', '..', process.argv[2]));

exec('git rev-parse HEAD', (err, stdout, _stderr) => {
  if (err) {
    console.error('Unable to get commit hash: ' + err.message);
    exit(1);
  }
  const expectedCommitHash = stdout.split('\n')[0];
  if (expectedCommitHash !== __commit_hash) {
    console.error('Expected: ' + expectedCommitHash + ', got: ' + __commit_hash);
    exit(2);
  }
  console.log('✔️ Referencing the correct version of fast-check');
  console.log('✔️ Commit hash matches expected one: ' + expectedCommitHash);
});
