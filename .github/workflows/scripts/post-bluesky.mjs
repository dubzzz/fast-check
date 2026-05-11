// @ts-check
import { Agent, CredentialSession, RichText } from '@atproto/api';

const identifier = requireEnv('BLUESKY_IDENTIFIER');
const password = requireEnv('BLUESKY_APP_PASSWORD');
const discussionUrl = requireEnv('DISCUSSION_URL');
const releaseTag = requireEnv('RELEASE_TAG');

const session = new CredentialSession(new URL('https://bsky.social'));
await session.login({ identifier, password });
const agent = new Agent(session);

const text = `🚀 New release: ${formatReleaseLabel(releaseTag)}\n\nRead the announcement and changelog: ${discussionUrl}`;
const richText = new RichText({ text });
await richText.detectFacets(agent);

const result = await agent.post({
  text: richText.text,
  facets: richText.facets,
  langs: ['en'],
});
console.log(`Posted to Bluesky: ${result.uri}`);

// Helpers

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing ${name} env var`);
  }
  return value;
}

function formatReleaseLabel(tag) {
  const slashIndex = tag.indexOf('/');
  if (slashIndex === -1) {
    return `fast-check ${tag}`;
  }
  const scope = tag.slice(0, slashIndex);
  const version = tag.slice(slashIndex + 1);
  return `@fast-check/${scope} ${version}`;
}
