const core = require('@actions/core');
const github = require('@actions/github');

async function isAdmin(context, octokit) {
  try {
    const response = await octokit.repos.getCollaboratorPermissionLevel({
      ...context.repo,
      username: context.actor,
    });
    return response.data.permission === 'admin';
  } catch (err) {
    core.setFailed(`Unable get details for current user, failed with: ${err}`);
    return false;
  }
}

async function run() {
  const context = github.context;
  const action = core.getInput('action', { required: true });
  const token = core.getInput('token');
  const requireAdmin = core.getInput('require_admin');
  const reaction = core.getInput('reaction') || '+1';
  const octokit = github.getOctokit(token);

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
  const adminRequirementsFulfilled = requireAdmin.toLowerCase() === 'true' ? await isAdmin(context, octokit) : true;

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

  try {
    await octokit.reactions.createForIssueComment({
      ...context.repo,
      comment_id: comment.id,
      content: reaction,
    });
  } catch (err) {
    core.info(`Failed to add a reaction, got error: ${err}`);
  }
}

run().catch((err) => core.setFailed(`Failed with error: ${err}`));
