// @ts-check
// Post a release announcement on Bluesky linking back to the GitHub Release discussion.
//
// Required env vars:
// - BLUESKY_IDENTIFIER:   Bluesky handle (e.g. "fast-check.bsky.social") or DID
// - BLUESKY_APP_PASSWORD: App password generated in Bluesky settings
// - DISCUSSION_URL:       URL of the GitHub Release discussion to share
// - RELEASE_NAME and/or RELEASE_TAG: Used as the human-readable release label
//
// Optional env vars:
// - BLUESKY_SERVICE: AT Protocol service URL (default: https://bsky.social)

const { AtpAgent, RichText } = require('@atproto/api');

async function main() {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  const discussionUrl = process.env.DISCUSSION_URL;
  const releaseLabel = process.env.RELEASE_NAME || process.env.RELEASE_TAG;
  const service = process.env.BLUESKY_SERVICE || 'https://bsky.social';

  if (!identifier) throw new Error('Missing BLUESKY_IDENTIFIER env var');
  if (!password) throw new Error('Missing BLUESKY_APP_PASSWORD env var');
  if (!discussionUrl) throw new Error('Missing DISCUSSION_URL env var');
  if (!releaseLabel) throw new Error('Missing RELEASE_NAME or RELEASE_TAG env var');

  const agent = new AtpAgent({ service });
  await agent.login({ identifier, password });

  const text = `🚀 New release: ${releaseLabel}\n\nRead the announcement and changelog: ${discussionUrl}`;
  const richText = new RichText({ text });
  await richText.detectFacets(agent);

  const result = await agent.post({
    text: richText.text,
    facets: richText.facets,
    langs: ['en'],
  });
  console.log(`Posted to Bluesky: ${result.uri}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
