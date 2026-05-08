// @ts-check
// Post a release announcement on Bluesky linking back to the GitHub Release discussion.
//
// Required env vars:
// - BLUESKY_IDENTIFIER:   Bluesky handle (e.g. "fast-check.bsky.social") or DID
// - BLUESKY_APP_PASSWORD: App password generated in Bluesky settings
// - DISCUSSION_URL:       URL of the GitHub Release discussion to share
// - RELEASE_TAG:          Git tag of the release (e.g. "v3.5.0", "vitest/v1.2.0")

import { AtpAgent, RichText } from '@atproto/api';

/**
 * @param {string} name
 * @returns {string}
 */
function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing ${name} env var`);
  }
  return value;
}

/**
 * Convert a release git tag to a human-friendly label.
 * fast-check tags are bare (e.g. `v3.5.0`); other packages are prefixed
 * with their directory under packages/ (e.g. `vitest/v1.2.0`).
 * @param {string} tag
 * @returns {string}
 */
function formatReleaseLabel(tag) {
  const slashIndex = tag.indexOf('/');
  if (slashIndex === -1) {
    return `fast-check ${tag}`;
  }
  const scope = tag.slice(0, slashIndex);
  const version = tag.slice(slashIndex + 1);
  return `@fast-check/${scope} ${version}`;
}

const identifier = requireEnv('BLUESKY_IDENTIFIER');
const password = requireEnv('BLUESKY_APP_PASSWORD');
const discussionUrl = requireEnv('DISCUSSION_URL');
const releaseTag = requireEnv('RELEASE_TAG');

const agent = new AtpAgent({ service: 'https://bsky.social' });
await agent.login({ identifier, password });

const text = `🚀 New release: ${formatReleaseLabel(releaseTag)}\n\nRead the announcement and changelog: ${discussionUrl}`;
const richText = new RichText({ text });
await richText.detectFacets(agent);

const result = await agent.post({
  text: richText.text,
  facets: richText.facets,
  langs: ['en'],
});
console.log(`Posted to Bluesky: ${result.uri}`);
