async function isAdmin(context, octokit) {
  try {
    const response = await octokit.repos.getCollaboratorPermissionLevel({
      ...context.repo,
      username: context.actor,
    });
    return response.data.permission === 'admin';
  } catch (err) {
    throw new Error(`Unable get details for current user, failed with: ${err}`);
  }
}

module.exports = async ({ github, context, options }) => {
  try {
    const {
      action, // Name of the action / required
      requireAdmin, // Does it require an admin?
      reaction = '+1', // Reaction to add onto the comment
    } = options;

    const comment = context.payload.comment;
    if (comment === undefined || !('body' in comment)) {
      throw new Error(`Unable to access the body of the comment`);
    }
    const commentBody = context.payload.comment.body;

    const requestToBot = commentBody.startsWith('@github-actions');
    const requestsFromComment = commentBody
      .split(/\s/g)
      .slice(1)
      .map((request) => request.trim());
    const actionFound = requestsFromComment.find((request) => request === action) !== undefined;
    const adminRequirementsFulfilled = requireAdmin ? await isAdmin(context, github) : true;

    console.info(`requestToBot: ${requestToBot}`);
    console.info(`actionFound: ${actionFound} (request included: ${requestsFromComment.join(', ')})`);
    console.info(`adminRequirementsFulfilled: ${adminRequirementsFulfilled}`);

    const acceptedAction = requestToBot && actionFound && adminRequirementsFulfilled;
    if (!acceptedAction) {
      throw new Error(`Invalid command for: "@github-actions ${action}"`);
    }
    console.log('valid_comment: ' + acceptedAction);
    console.log('pull_number: ' + context.issue.number);

    try {
      await github.reactions.createForIssueComment({
        ...context.repo,
        comment_id: comment.id,
        content: reaction,
      });
    } catch (err) {
      console.info(`Failed to add a reaction, got error: ${err}`);
    }
  } catch (err) {
    throw new Error(`Failed with error: ${err}`);
  }
};
