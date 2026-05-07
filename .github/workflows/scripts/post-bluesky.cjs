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

const SERVICE = process.env.BLUESKY_SERVICE || 'https://bsky.social';

async function loginBluesky(identifier, password) {
  const response = await fetch(`${SERVICE}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bluesky login failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function createRecord(accessJwt, did, record) {
  const response = await fetch(`${SERVICE}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessJwt}`,
    },
    body: JSON.stringify({
      repo: did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Bluesky post failed (${response.status}): ${body}`);
  }
  return response.json();
}

// Bluesky requires explicit byte-offset facets for URLs to be clickable.
function buildPostRecord(text, url) {
  const occurrence = text.indexOf(url);
  if (occurrence === -1) {
    throw new Error('Expected post text to contain the announced URL');
  }
  const byteStart = Buffer.byteLength(text.slice(0, occurrence), 'utf8');
  const byteEnd = byteStart + Buffer.byteLength(url, 'utf8');
  return {
    $type: 'app.bsky.feed.post',
    text,
    facets: [
      {
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
      },
    ],
    langs: ['en'],
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  const discussionUrl = process.env.DISCUSSION_URL;
  const releaseLabel = process.env.RELEASE_NAME || process.env.RELEASE_TAG;

  if (!identifier) throw new Error('Missing BLUESKY_IDENTIFIER env var');
  if (!password) throw new Error('Missing BLUESKY_APP_PASSWORD env var');
  if (!discussionUrl) throw new Error('Missing DISCUSSION_URL env var');
  if (!releaseLabel) throw new Error('Missing RELEASE_NAME or RELEASE_TAG env var');

  const text = `🚀 New release: ${releaseLabel}\n\nRead the announcement and changelog: ${discussionUrl}`;
  const session = await loginBluesky(identifier, password);
  const result = await createRecord(session.accessJwt, session.did, buildPostRecord(text, discussionUrl));
  console.log(`Posted to Bluesky: ${result.uri}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
