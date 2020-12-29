const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  const context = github.context;
  const token = core.getInput('token', { required: true });

  if (context.eventName !== 'pull_request') {
    core.setFailed(`comment-on-pr can only be used on pull_request`);
    return;
  }
  const packageUrl = `https://pkg.csb.dev/dubzzz/fast-check/commit/${context.sha.substring(0, 8)}/fast-check`;
  const octokit = github.getOctokit(token);
  const body =
    `Give a try to https://github.com/dubzzz/fast-check/pull/${context.issue.number}/commits/${context.sha} with:\n\n` +
    '```bash\n' +
    `yarn add ${packageUrl}\n` +
    `npm i ${packageUrl}\n` +
    '```\n\n' +
    '<details>\n' +
    '<summary>More details on this run</summary>\n\n' +
    `- On Codeclimate: https://codeclimate.com/github/dubzzz/fast-check/pull/${context.issue.number}` +
    `- On Codecov: https://codecov.io/gh/dubzzz/fast-check/pull/${context.issue.number}` +
    `- On CodeSandbox: https://ci.codesandbox.io/status/dubzzz/fast-check/pr/${context.issue.number}` +
    `- On GitHub Actions: https://github.com/dubzzz/fast-check/actions/runs/${context.runId}` +
    '</details>';

  await octokit.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  });
}

run().catch((err) => core.setFailed(`Failed with error: ${err}`));
