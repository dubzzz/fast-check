const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');

const verboseLog = (...args) => {
  core.debug(args.join(' '));
};
const cleanErr = (err) => {
  if (!err) return err;
  const { stack, ...others } = err;
  return others;
};
const execAsync = (command, options) => {
  const prettyCmd = `exec(${JSON.stringify(command)}, ${JSON.stringify(options)}})`;
  return new Promise((resolve) => {
    verboseLog(`Call to ${prettyCmd}`);
    exec(command, options, (err, stdout, stderr) => {
      verboseLog(`Answer from ${prettyCmd}`);
      verboseLog(`err:`, cleanErr(err));
      verboseLog(`stdout:`, stdout.toString());
      verboseLog(`stderr:`, stderr.toString());
      resolve({ err, stdout, stderr });
    });
  });
};

async function run() {
  const context = github.context;
  const token = core.getInput('token', { required: true });

  if (context.eventName !== 'pull_request') {
    core.setFailed(`comment-on-pr can only be used on pull_request`);
    return;
  }

  const { err, stdout: commitHash } = await execAsync('git rev-parse HEAD^');
  if (err && err.code) {
    core.setFailed(`comment-on-pr failed to get back commit hash, failed with error: ${err}`);
    return;
  }

  const packageUrl = `https://pkg.csb.dev/dubzzz/fast-check/commit/${commitHash.substring(0, 8)}/fast-check`;
  const octokit = github.getOctokit(token);
  const body =
    `Give a try to https://github.com/dubzzz/fast-check/pull/${context.issue.number}/commits/${commitHash} with:\n\n` +
    '```bash\n' +
    `yarn add ${packageUrl}\n` +
    `npm i ${packageUrl}\n` +
    '```\n\n' +
    '<details>\n' +
    '<summary>More details on this run</summary>\n\n' +
    `- On Codeclimate: https://codeclimate.com/github/dubzzz/fast-check/pull/${context.issue.number}\n` +
    `- On Codecov: https://codecov.io/gh/dubzzz/fast-check/pull/${context.issue.number}\n` +
    `- On CodeSandbox: https://ci.codesandbox.io/status/dubzzz/fast-check/pr/${context.issue.number}\n` +
    `- On GitHub Actions: https://github.com/dubzzz/fast-check/actions/runs/${context.runId}\n` +
    '</details>';

  await octokit.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  });
}

run().catch((err) => core.setFailed(`Failed with error: ${err}`));
