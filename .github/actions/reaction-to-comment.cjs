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

module.exports = async ({ github, context, core, options }) => {
  try {
    const {
      action, // Name of the action / required
      requireAdmin, // Does it require an admin?
      reaction = '+1', // Reaction to add onto the comment
    } = options;

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
    const adminRequirementsFulfilled = requireAdmin.toLowerCase() === 'true' ? await isAdmin(context, github) : true;

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
      await github.reactions.createForIssueComment({
        ...context.repo,
        comment_id: comment.id,
        content: reaction,
      });
    } catch (err) {
      core.info(`Failed to add a reaction, got error: ${err}`);
    }
  } catch (err) {
    core.setFailed(`Failed with error: ${err}`);
  }
};
