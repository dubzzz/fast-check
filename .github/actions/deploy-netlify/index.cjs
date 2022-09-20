const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');

const verboseLog = (...args) => {
  core.info(args.join(' '));
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
      verboseLog(`err:`, JSON.stringify(cleanErr(err)));
      verboseLog(`stdout:`, stdout.toString());
      verboseLog(`stderr:`, stderr.toString());
      resolve({ err, stdout, stderr });
    });
  });
};

async function run() {
  const context = github.context;
  const token = core.getInput('token', { required: true });

  const { err, stdout: commitHash } = await execAsync('git rev-parse HEAD');
  if (err && err.code) {
    core.setFailed(`deploy-netlify failed to get back commit hash, failed with error: ${err}`);
    return;
  }

  const { err: netlifyDeployErr, stdout: netlifyLog } = await execAsync(
    'netlify deploy --dir=packages/fast-check/docs/ --message="Publish to Netlify on PR"'
  );
  if (netlifyDeployErr && netlifyDeployErr.code) {
    core.setFailed(`deploy-netlify failed on deploy: ${netlifyDeployErr}`);
    return;
  }
  // Website Draft URL: https://xxxxxxx.netlify.app
  const ansiModifiersRegex = /\u001b\[\d\dm/gu;
  const netlifyUrlLine = netlifyLog
    .split('\n')
    .map((line) => line.replace(ansiModifiersRegex, ''))
    .find((line) => line.includes('Website Draft URL: '));
  if (!netlifyUrlLine) {
    core.setFailed(`deploy-netlify failed to find the deployment line in:\n\n${netlifyLog}`);
    return;
  }
  const netlifyUrlRegex = /Website Draft URL:\s+(https:\/\/[^\s]*)/;
  const m = netlifyUrlRegex.exec(netlifyUrlLine);
  if (!m) {
    core.setFailed(`deploy-netlify failed to find the deployment url in:\n${netlifyUrlLine}`);
    return;
  }

  const netlifyUrl = m[1];
  const packageUrl = `${netlifyUrl}/fast-check.tgz`;
  const octokit = github.getOctokit(token);
  const body =
    `Give a try to https://github.com/dubzzz/fast-check/pull/${context.issue.number}/commits/${commitHash
      .split('\n')[0]
      .trim()} with:\n\n` +
    '```bash\n' +
    `yarn add ${packageUrl}\n` +
    `npm i ${packageUrl}\n` +
    '```\n\n' +
    `Or have a look to the [generated documentation](${netlifyUrl}).`;

  await octokit.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  });
}

run().catch((err) => core.setFailed(`Failed with error: ${err}`));
