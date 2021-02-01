const core = require('@actions/core');
const github = require('@actions/github');

async function isAdmin() {
  const context = github.context;
  const token = core.getInput('token', { required: true });
  const octokit = github.getOctokit(token);
  const response = await octokit.repos.getCollaboratorPermissionLevel({ ...context.repo, username: context.actor });
  return response.data.permission === 'admin';
}

async function run() {
  const context = github.context;
  const action = core.getInput('action', { required: true });
  const requireAdmin = core.getInput('require_admin');

  const comment = context.payload.comment;
  if (comment === undefined || !('body' in comment)) {
    core.setFailed(`Unable to access the body of the comment`);
    return;
  }
  const commentBody = context.payload.comment.body;

  const requestToBot = commentBody.startsWith('@github-actions');
  const requestsFromComment = commentBody
    .split(/\s/g)
    .slice(1)
    .map((request) => request.trim());
  const actionFound = requestsFromComment.find((request) => request === action) !== undefined;
  const adminRequirementsFulfilled = requireAdmin.toLowerCase() === 'true' ? await isAdmin() : true;

  core.info(`requestToBot: ${requestToBot}`);
  core.info(`actionFound: ${actionFound} (request included: ${requestsFromComment.join(', ')})`);
  core.info(`adminRequirementsFulfilled: ${adminRequirementsFulfilled}`);

  const acceptedAction = requestToBot && actionFound && adminRequirementsFulfilled;
  if (!acceptedAction) {
    core.setFailed(`Invalid command for: "@github-actions ${action}"`);
    return;
  }
  core.setOutput('valid_comment', acceptedAction);
  core.setOutput('pull_number', context.issue.number);
}

run().catch((err) => core.setFailed(`Failed with error: ${err}`));
