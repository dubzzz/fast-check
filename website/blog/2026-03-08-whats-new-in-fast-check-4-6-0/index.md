---
title: What's new in fast-check 4.6.0?
authors: [dubzzz]
tags: [release, stringMatching, regex, bundle-size, performance]
---

Until now, `stringMatching` had no built-in way to cap the length of the produced strings except applying a manual post-filter on the generated values. This release adds a `maxLength` constraint to ensure that values stay within bounds by construct without running excessive and costly filtering.

Our published bundle is also lighter by 17% as it went from 1618 kB to 1344 kB.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Bound `stringMatching` with `maxLength`

Before 4.6.0, `stringMatching` could produce strings of arbitrary length depending on the regex. For open-ended patterns such as `/[a-z]+@[a-z]+\.[a-z]+/`, the generator had no upper limit on the number of characters it could emit. The only limit it relied on was controlled by the notion of size.

When testing code that expects bounded inputs the only workaround was to add an external `.filter()` call. Unfortunately such call was hurting generation efficiency as it implied throwing away many already generated values.

Starting with 4.6.0, you can pass `maxLength` directly:

```ts
fc.stringMatching(/[a-z]+@[a-z]+\.[a-z]+/, { maxLength: 50 });
```

Under the hood, the regex AST is rewritten before generation. Unbounded quantifiers like `*` and `+` are turned into explicit ranges and repetition counts in alternatives are distributed so that the overall length budget is respected. This means most generated candidates already satisfy the constraint without filtering. Even with our adapted regex AST trick, the generator still has to falls back to post-filtering so that invalid values are never exposed.

This new flow makes generation of bounded values fast thanks to less post-filtering and smaller values being generated.

As an example, the call to `fc.stringMatching(/^[a-z]+@[a-z]+\.[a-z]+$/, { maxLength: 50 })` will result into the regex `/^[a-z]{1,47}@[a-z]{1,47}\.[a-z]{1,47}$/`. This example clearly shows that post-filtering is still needed but that adapted regex tries to limit as much a possible wrong values from being generated.

## Lighter bundle

This release migrates our build pipeline from pure [Typescript](https://www.typescriptlang.org/) to [Rolldown](https://rolldown.rs/). We also benefit from the same improvements from our underlying random number generator library by moving to its latest major.

These changes reduce the size of our published bundle from 1618 kB down to 1344 kB. It also cut the file count from 1331 to just 11.

A smaller bundle also translates into faster import times. On our side we measured import speed improvements ranging from 1.75x to 2.35x faster depending on the environment (e.g. GitHub Codespace, Windows workstation).

## Deprecation of `Random::next(n)` and `Random::nextInt()`

The method `Random::next(n)` and the no-argument `Random::nextInt()` have been marked as deprecated. Calls to these methods can be replaced by calls to `Random::nextInt(min, max)`.

On the long run, we probably plan to deprecate the whole `Random` class in favor of the instances directly coming from `pure-rand`. By doing so we hope dropping one unneeded indirection to have faster random values generation and we also want to let user decide on the distribution they want to raise in their arbitraries.

## Changelog since 4.5.0

The version 4.6.0 is based on version 4.5.3.

### Features

- ([PR#6599](https://github.com/dubzzz/fast-check/pull/6599)) Add basic `maxLength` support to `stringMatching`
- ([PR#6600](https://github.com/dubzzz/fast-check/pull/6600)) Better clamp on regexes when `maxLength` on `stringMatching`
- ([PR#6687](https://github.com/dubzzz/fast-check/pull/6687)) Deprecate `Random::next(n)` and `Random::nextInt()`

### Fixes

- ([PR#6502](https://github.com/dubzzz/fast-check/pull/6502)) Bug: Bad d.ts import in BuildInversedRelationsMapping
- ([PR#6578](https://github.com/dubzzz/fast-check/pull/6578)) Bug: Don't crash when stringifying detached ArrayBuffers
- ([PR#6700](https://github.com/dubzzz/fast-check/pull/6700)) Bug: Fix object unmapper and depth computation for special keys
- ([PR#6432](https://github.com/dubzzz/fast-check/pull/6432)) CI: Move all dependencies to dev on examples/
- ([PR#6443](https://github.com/dubzzz/fast-check/pull/6443)) CI: Migrate to Docusaurus v4 configuration format
- ([PR#6456](https://github.com/dubzzz/fast-check/pull/6456)) CI: Enable persist-credentials in add-contributor workflow
- ([PR#6501](https://github.com/dubzzz/fast-check/pull/6501)) CI: Bump module in tsconfig to node18
- ([PR#6548](https://github.com/dubzzz/fast-check/pull/6548)) CI: Fix zizmor ignore config line numbers
- ([PR#6554](https://github.com/dubzzz/fast-check/pull/6554)) CI: Drop tests against Node 20
- ([PR#6563](https://github.com/dubzzz/fast-check/pull/6563)) CI: Fix check_publish status to be success on no error
- ([PR#6565](https://github.com/dubzzz/fast-check/pull/6565)) CI: Add create release workflow
- ([PR#6610](https://github.com/dubzzz/fast-check/pull/6610)) CI: Rework pnpm configuration
- ([PR#6619](https://github.com/dubzzz/fast-check/pull/6619)) CI: Add PR template enforcement workflow
- ([PR#6622](https://github.com/dubzzz/fast-check/pull/6622)) CI: Skip Netlify doc publish on PRs
- ([PR#6625](https://github.com/dubzzz/fast-check/pull/6625)) CI: Run PR template check without approval
- ([PR#6623](https://github.com/dubzzz/fast-check/pull/6623)) CI: Skip PR template check for Renovate bot
- ([PR#6638](https://github.com/dubzzz/fast-check/pull/6638)) CI: Bundle `fast-check` using `rolldown`
- ([PR#6662](https://github.com/dubzzz/fast-check/pull/6662)) CI: Rework configuration of examples
- ([PR#6683](https://github.com/dubzzz/fast-check/pull/6683)) CI: Add Claude Code GitHub Action workflow
- ([PR#6684](https://github.com/dubzzz/fast-check/pull/6684)) CI: Add configuration for pre and post tool Claude hooks
- ([PR#6690](https://github.com/dubzzz/fast-check/pull/6690)) CI: Refine GH Action triggering CLAUDE
- ([PR#6693](https://github.com/dubzzz/fast-check/pull/6693)) CI: Configure another Claude model
- ([PR#6703](https://github.com/dubzzz/fast-check/pull/6703)) CI: Add top-level `permissions: {}` to workflows missing it
- ([PR#6704](https://github.com/dubzzz/fast-check/pull/6704)) CI: Refactor Claude workflow custom instructions configuration
- ([PR#6705](https://github.com/dubzzz/fast-check/pull/6705)) CI: Add SessionStart hook to ensure dependencies are installed
- ([PR#6597](https://github.com/dubzzz/fast-check/pull/6597)) Clean: Drop runkit file
- ([PR#6640](https://github.com/dubzzz/fast-check/pull/6640)) Clean: Drop unused "tsd" in package.json
- ([PR#6441](https://github.com/dubzzz/fast-check/pull/6441)) Doc: Release note for 4.5.0
- ([PR#6442](https://github.com/dubzzz/fast-check/pull/6442)) Doc: Replace generic blog tags with feature-specific taxonomy
- ([PR#6458](https://github.com/dubzzz/fast-check/pull/6458)) Doc: Add adamni21 as doc contributor
- ([PR#6496](https://github.com/dubzzz/fast-check/pull/6496)) Doc: Refine npm keywords
- ([PR#6514](https://github.com/dubzzz/fast-check/pull/6514)) Doc: Skill for JavaScript testing expert
- ([PR#6516](https://github.com/dubzzz/fast-check/pull/6516)) Doc: Add note to avoid overusing filter and fc.pre
- ([PR#6517](https://github.com/dubzzz/fast-check/pull/6517)) Doc: Update testing skill to recommend mimicking existing test structure
- ([PR#6523](https://github.com/dubzzz/fast-check/pull/6523)) Doc: Add PR template requirement to Copilot instructions
- ([PR#6522](https://github.com/dubzzz/fast-check/pull/6522)) Doc: Add note on complementary testing approaches
- ([PR#6524](https://github.com/dubzzz/fast-check/pull/6524)) Doc: Add snapshot vs screenshot guidance
- ([PR#6527](https://github.com/dubzzz/fast-check/pull/6527)) Doc: Push to install missing tooling
- ([PR#6530](https://github.com/dubzzz/fast-check/pull/6530)) Doc: Clearer guidelines for constraints of arbs in skill
- ([PR#6526](https://github.com/dubzzz/fast-check/pull/6526)) Doc: Add AI-powered testing documentation
- ([PR#6529](https://github.com/dubzzz/fast-check/pull/6529)) Doc: Add testing-library and browser testing part in skill
- ([PR#6528](https://github.com/dubzzz/fast-check/pull/6528)) Doc: Add bigint type preference for integer computations in skill
- ([PR#6531](https://github.com/dubzzz/fast-check/pull/6531)) Doc: Add TDD fashion thinking in skill
- ([PR#6553](https://github.com/dubzzz/fast-check/pull/6553)) Doc: Add josephjunker as doc contributor
- ([PR#6561](https://github.com/dubzzz/fast-check/pull/6561)) Doc: Add page on "What is property-based testing" and modify "Why property-based testing"
- ([PR#6605](https://github.com/dubzzz/fast-check/pull/6605)) Doc: Drop Snyk link on Readme
- ([PR#6603](https://github.com/dubzzz/fast-check/pull/6603)) Doc: Update CONTRIBUTING.md for AI
- ([PR#6572](https://github.com/dubzzz/fast-check/pull/6572)) Doc: Rework issue templates
- ([PR#6613](https://github.com/dubzzz/fast-check/pull/6613)) Doc: Update PR template
- ([PR#6634](https://github.com/dubzzz/fast-check/pull/6634)) Doc: Rework bug-report template
- ([PR#6635](https://github.com/dubzzz/fast-check/pull/6635)) Doc: Rework regression-report template
- ([PR#6652](https://github.com/dubzzz/fast-check/pull/6652)) Doc: Update Readme to point to npmx
- ([PR#6659](https://github.com/dubzzz/fast-check/pull/6659)) Doc: Update home to link to npmx
- ([PR#6696](https://github.com/dubzzz/fast-check/pull/6696)) Doc: Add rushelex as code contributor
- ([PR#6448](https://github.com/dubzzz/fast-check/pull/6448)) Performance: Optimize RunDetailsFormatter array allocations
- ([PR#5718](https://github.com/dubzzz/fast-check/pull/5718)) Performance: Import less from pure-rand
- ([PR#6679](https://github.com/dubzzz/fast-check/pull/6679)) Performance: Bump pure-rand to v8
- ([PR#6446](https://github.com/dubzzz/fast-check/pull/6446)) Performance: Replace loose equality by strict one
- ([PR#6444](https://github.com/dubzzz/fast-check/pull/6444)) Performance: Slightly faster code for RunExecution
- ([PR#6437](https://github.com/dubzzz/fast-check/pull/6437)) Refactor: Replace fileURLToPath patterns with import.meta.\*
- ([PR#6567](https://github.com/dubzzz/fast-check/pull/6567)) Refactor: Remove ErrorWithCause, use Error directly
- ([PR#6621](https://github.com/dubzzz/fast-check/pull/6621)) Refactor: Replace glob package with native Node.js fs.glob
- ([PR#6675](https://github.com/dubzzz/fast-check/pull/6675)) Refactor: Drop @rollup/plugin-replace for rolldown builtin
- ([PR#6550](https://github.com/dubzzz/fast-check/pull/6550)) Security: Fix zizmor template-injection findings
- ([PR#6472](https://github.com/dubzzz/fast-check/pull/6472)) Test: Provide cause when doc generation fails
- ([PR#6381](https://github.com/dubzzz/fast-check/pull/6381)) Test: Migrate test-types to vitest
- ([PR#6507](https://github.com/dubzzz/fast-check/pull/6507)) Test: Filter ESM-only packages from CommonJS mode checks
- ([PR#6453](https://github.com/dubzzz/fast-check/pull/6453)) Typo: Fix typo for dictionary arbitrary constraint maxKeys
- ([PR#6552](https://github.com/dubzzz/fast-check/pull/6552)) Typo: Replace `flatMap` with `chain` in error message