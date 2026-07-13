---
title: What's new in fast-check 4.9.0?
authors: [dubzzz]
tags: [release]
---

Supporting shrink is crucial for the built-in arbitraries in fast-check. For this release, we deeply reworked `entityGraph` to give it built-in shrinking support. But this release is above all about performance. We spent the last few weeks tracking any optimization that we can put into fast-check on its critical and hot code paths.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Rebuilding `entityGraph` on core primitives

Our initial implementation of `entityGraph` was pretty ad-hoc. It was mostly a manual implementation of an `Arbitrary` barely re-using any existing primitives from fast-check. It worked but missed key capabilities coming with our core building blocks.

The reason for that choice is twofold:

- The arbitrary was complex, it took us time to get a comprehensive enough picture of how we would implement it. As such going manual helped us sketch how we could generate such values. This first sketch got translated in this release into core building blocks.
- We were missing a key building block: [`chainUntil`](/core-blocks/arbitraries/combiners/any/#chainuntil) (landed in [4.8.0](/blog/2026/06/25/whats-new-in-fast-check-4-8-0/)).

In this minor release, we switched from a manual and tailored implementation of the `Arbitrary` class to an arbitrary composing several building blocks from fast-check. Such switch allowed multiple cool things:

- The arbitrary now benefits from shrinking capabilities. We don't have to do special tricks for it to work.
- The arbitrary also benefits from all performance optimizations made to core building blocks. As such optimizing them benefits other arbitraries even more.

## Changelog since 4.8.0

The version 4.9.0 is based on version 4.8.0.

### Features

- ([PR#7008](https://github.com/dubzzz/fast-check/pull/7008)) Towards shrinkable `entityGraph` thanks to `chainUntil`

### Fixes

- ([PR#7010](https://github.com/dubzzz/fast-check/pull/7010)) Bug: Fix latent state-sharing bug in entityGraph
- ([PR#7063](https://github.com/dubzzz/fast-check/pull/7063)) Bug: Equiprobable alternatives in `stringMatching`
- ([PR#6973](https://github.com/dubzzz/fast-check/pull/6973)) CI: Drop caches on push for build package flow
- ([PR#6971](https://github.com/dubzzz/fast-check/pull/6971)) CI: Only mark fast-check's releases as latest
- ([PR#6974](https://github.com/dubzzz/fast-check/pull/6974)) CI: Drop pull_request_target flows
- ([PR#6975](https://github.com/dubzzz/fast-check/pull/6975)) CI: Drop discussion creation on release publish
- ([PR#6976](https://github.com/dubzzz/fast-check/pull/6976)) CI: Drop caches from publication steps
- ([PR#6977](https://github.com/dubzzz/fast-check/pull/6977)) CI: Revert "Drop caches from publication steps"
- ([PR#6978](https://github.com/dubzzz/fast-check/pull/6978)) CI: Make zizmor audit a required status check
- ([PR#6991](https://github.com/dubzzz/fast-check/pull/6991)) CI: Remove Claude Code workflow
- ([PR#6994](https://github.com/dubzzz/fast-check/pull/6994)) CI: Replace `pnpm dlx` with `pnpm exec` for `pkg-pr-new`
- ([PR#6995](https://github.com/dubzzz/fast-check/pull/6995)) CI: Inline zizmor ignores in workflow
- ([PR#6996](https://github.com/dubzzz/fast-check/pull/6996)) CI: Move to `devEngines.packageManager`
- ([PR#7005](https://github.com/dubzzz/fast-check/pull/7005)) CI: Update PULL_REQUEST_TEMPLATE.md
- ([PR#7011](https://github.com/dubzzz/fast-check/pull/7011)) CI: Drop OTP prompt from npm publish
- ([PR#7013](https://github.com/dubzzz/fast-check/pull/7013)) CI: Switch release jobs to npm stage publish
- ([PR#7027](https://github.com/dubzzz/fast-check/pull/7027)) CI: Run benchmarks against `main`
- ([PR#7037](https://github.com/dubzzz/fast-check/pull/7037)) CI: Use comparison mode for `bench`
- ([PR#7069](https://github.com/dubzzz/fast-check/pull/7069)) CI: Run pnpm dedupe to deduplicate lockfile
- ([PR#6959](https://github.com/dubzzz/fast-check/pull/6959)) CI: Announce releases on Bluesky
- ([PR#7105](https://github.com/dubzzz/fast-check/pull/7105)) CI: Switch to actions/attest for attestations
- ([PR#7117](https://github.com/dubzzz/fast-check/pull/7117)) CI: Use pnpm version in changelog script
- ([PR#7120](https://github.com/dubzzz/fast-check/pull/7120)) CI: Allow unclean tree in changelog generation
- ([PR#7125](https://github.com/dubzzz/fast-check/pull/7125)) CI: Stage publish using `pnpm` in publish jobs
- ([PR#7065](https://github.com/dubzzz/fast-check/pull/7065)) Clean: Delete skills directory
- ([PR#6983](https://github.com/dubzzz/fast-check/pull/6983)) Doc: Tweak PR Template to hint AI agents into revealing themselves
- ([PR#7092](https://github.com/dubzzz/fast-check/pull/7092)) Doc: Add back skills directory
- ([PR#7095](https://github.com/dubzzz/fast-check/pull/7095)) Doc: Add release notes for fast-check 4.8.0
- ([PR#7104](https://github.com/dubzzz/fast-check/pull/7104)) Doc: Add makeeno as doc contributor
- ([PR#7103](https://github.com/dubzzz/fast-check/pull/7103)) Doc: Fix info box in docs
- ([PR#7108](https://github.com/dubzzz/fast-check/pull/7108)) Doc: Add jneidel as doc contributor
- ([PR#7035](https://github.com/dubzzz/fast-check/pull/7035)) Performance: Faster `fc.integer` on `generate`
- ([PR#7046](https://github.com/dubzzz/fast-check/pull/7046)) Performance: Faster fc.record on generate
- ([PR#7047](https://github.com/dubzzz/fast-check/pull/7047)) Performance: Faster fc.dictionary on generate
- ([PR#7048](https://github.com/dubzzz/fast-check/pull/7048)) Performance: Faster `fc.webPath`/`fc.webUrl` on `generate`
- ([PR#7050](https://github.com/dubzzz/fast-check/pull/7050)) Performance: Faster `fc.stringMatching` for `\W` `\D` `\S` `.`
- ([PR#7054](https://github.com/dubzzz/fast-check/pull/7054)) Performance: Faster `fc.stringMatching` on `generate`
- ([PR#7049](https://github.com/dubzzz/fast-check/pull/7049)) Performance: Drop nested `tuple` on `generate` for `fc.record`
- ([PR#7045](https://github.com/dubzzz/fast-check/pull/7045)) Performance: Faster `fc.entityGraph` on `generate`
- ([PR#7071](https://github.com/dubzzz/fast-check/pull/7071)) Performance: Early exit on empty tuple in `fc.entityGraph`
- ([PR#7004](https://github.com/dubzzz/fast-check/pull/7004)) Refactor: Extract code from `onTheFlyLinksForEntityGraph`
- ([PR#7006](https://github.com/dubzzz/fast-check/pull/7006)) Refactor: Move `generate` logic to the `Arbitrary` for `entityGraph`
- ([PR#7007](https://github.com/dubzzz/fast-check/pull/7007)) Refactor: Introduce `ProductionState` for `onTheFlyLinks...`
- ([PR#6990](https://github.com/dubzzz/fast-check/pull/6990)) Script: Skip scripts during `pnpm i` in changelog generation
- ([PR#7039](https://github.com/dubzzz/fast-check/pull/7039)) Script: More benchmark commands
- ([PR#6972](https://github.com/dubzzz/fast-check/pull/6972)) Security: Pass `--ignore-scripts` to `pnpm i` calls
- ([PR#7028](https://github.com/dubzzz/fast-check/pull/7028)) Test: Add benchmarks for key arbitraries
- ([PR#7034](https://github.com/dubzzz/fast-check/pull/7034)) Test: Expand benchmark coverage across arbitrary families
- ([PR#7041](https://github.com/dubzzz/fast-check/pull/7041)) Test: Add runners related benchs
- ([PR#7064](https://github.com/dubzzz/fast-check/pull/7064)) Test: Clarify arbitrary benchmark names
- ([PR#7068](https://github.com/dubzzz/fast-check/pull/7068)) Test: More reliable arbitraries.bench.ts
- ([PR#7088](https://github.com/dubzzz/fast-check/pull/7088)) Typo: Typo in type `EntityGraphContraints`
