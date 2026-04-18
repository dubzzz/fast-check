---
title: What's new in fast-check 4.7.0?
authors: [dubzzz]
tags: [release, stringMatching, regex, unicode, json]
---

Until now, Unicode property escapes of the form `\p{...}` or `\P{...}` were not implemented in `stringMatching`. This release adds support for them so `stringMatching` can generate matching values directly.

This release also makes `fc.json()` reversible, allowing arbitrary JSON strings to be shrunk even when they did not originate from fast-check itself.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Unicode properties in `stringMatching`

Regular expressions can restrict their character set with Unicode property escapes such as `\p{Emoji}` or `\P{ASCII}`. Before 4.7.0, feeding such a regex to `stringMatching` threw a "not implemented yet" error.

Starting with 4.7.0, `stringMatching` recognises both `\p{...}` (positive) and `\P{...}` (negated) forms:

```ts
// Strings made of emoji characters
// e.g. "🦎👭👇🚀🕍", "🍻😁🧀🪠🕹"
fc.stringMatching(/^\p{Emoji}+$/u);

// One uppercase letter followed by one or more lowercase letters
// e.g. "Gụ", "F𞤻applyg"
fc.stringMatching(/^\p{Uppercase_Letter}\p{Lowercase_Letter}+$/u);

// Strings made only of non-ASCII characters
// e.g. "𸉂􏿼", "𿝘𖈝"
fc.stringMatching(/^\P{ASCII}+$/u);
```

Under the hood, each property is expanded into the set of codepoints it covers and plugged into the existing machinery backing character classes. The resulting ranges are computed once and cached, so subsequent uses of the same property stay cheap.

Support covers binary properties like `Emoji`, `Alphabetic` or `Math`, general categories such as `Letter`, `Decimal_Number` or `Punctuation`, plus scripts through `Script=Greek`, `sc=Han` and friends. This should let you keep your regex expressive when testing code that handles internationalised inputs.

## Reversible `json` arbitrary

The `json` arbitrary is built by serialising the output of `jsonValue` through `JSON.stringify`. Until this release, that mapping was one-way: fast-check could produce JSON strings but could not recognise externally-provided ones. As a consequence, scenarios relying on replaying or recomposing values (for instance shrinking a payload captured from production logs) could not leverage `fc.json()`.

Starting with 4.7.0, the arbitrary carries an unmapper based on `JSON.parse`. Any valid JSON string is now accepted and shrinkable:

```ts
const arb = fc.json();
arb.canShrinkWithoutContext('{"a":{"b":[1,2,3]}}'); // now true
```

This unlocks composition with other arbitraries that expect a reversible building block and makes `fc.json()` a drop-in candidate wherever you need to replay a JSON input without re-generating it from scratch.

## Changelog since 4.6.0

The version 4.7.0 is based on version 4.6.0.

### Features

- ([PR#6866](https://github.com/dubzzz/fast-check/pull/6866)) Reversible `json` arbitrary
- ([PR#6868](https://github.com/dubzzz/fast-check/pull/6868)) Parse `\p{}` and `\P{}` in `stringMatching`
- ([PR#6870](https://github.com/dubzzz/fast-check/pull/6870)) Support for `\p{UnicodeProperty}` in `stringMatching`
- ([PR#6871](https://github.com/dubzzz/fast-check/pull/6871)) Support negated unicode properties in `stringMatching`

### Fixes

- ([PR#6710](https://github.com/dubzzz/fast-check/pull/6710)) CI: Pass explicit string to `make_latest`
- ([PR#6714](https://github.com/dubzzz/fast-check/pull/6714)) CI: Remove unused vite dependency from multiple packages
- ([PR#6780](https://github.com/dubzzz/fast-check/pull/6780)) CI: Silent zizmor issues (as they used to be)
- ([PR#6786](https://github.com/dubzzz/fast-check/pull/6786)) CI: Configure release workflow settings for announcements
- ([PR#6787](https://github.com/dubzzz/fast-check/pull/6787)) CI: Add force-build-status-execution label trigger to CI workflow
- ([PR#6818](https://github.com/dubzzz/fast-check/pull/6818)) CI: Push tag after creating draft release
- ([PR#6827](https://github.com/dubzzz/fast-check/pull/6827)) CI: Update CSP for our playgrounds backed by stackblitz
- ([PR#6832](https://github.com/dubzzz/fast-check/pull/6832)) CI: Add format/lint/typecheck hooks for Claude Code
- ([PR#6834](https://github.com/dubzzz/fast-check/pull/6834)) CI: Fix Claude's session start hook
- ([PR#6852](https://github.com/dubzzz/fast-check/pull/6852)) CI: Skip website prebuild remote fetches on cloud Claude Code
- ([PR#6869](https://github.com/dubzzz/fast-check/pull/6869)) CI: Add workflow to clean up GitHub Actions caches
- ([PR#6789](https://github.com/dubzzz/fast-check/pull/6789)) Clean: Remove unused code identified by knip
- ([PR#6711](https://github.com/dubzzz/fast-check/pull/6711)) Doc: Release note for version 4.6.0
- ([PR#6756](https://github.com/dubzzz/fast-check/pull/6756)) Doc: Fix typo in the documentation
- ([PR#6758](https://github.com/dubzzz/fast-check/pull/6758)) Doc: Add rugk as doc contributor
- ([PR#6764](https://github.com/dubzzz/fast-check/pull/6764)) Doc: Document gitmoji PR naming
- ([PR#6776](https://github.com/dubzzz/fast-check/pull/6776)) Doc: Add nielk as code contributor
- ([PR#6753](https://github.com/dubzzz/fast-check/pull/6753)) Doc: Migrate playgrounds in documentation to StackBlitz
- ([PR#6830](https://github.com/dubzzz/fast-check/pull/6830)) Doc: Switch to `?raw` imports for advents
- ([PR#6836](https://github.com/dubzzz/fast-check/pull/6836)) Doc: Add Vitest documentation guide for setting up property-based testing
- ([PR#6833](https://github.com/dubzzz/fast-check/pull/6833)) Doc: Remove dead doc hub pages
- ([PR#6855](https://github.com/dubzzz/fast-check/pull/6855)) Doc: Integrate API reference natively into our doc
- ([PR#6867](https://github.com/dubzzz/fast-check/pull/6867)) Doc: Simplify examples
- ([PR#6835](https://github.com/dubzzz/fast-check/pull/6835)) Script: Migrate from ESLint to oxlint
- ([PR#6872](https://github.com/dubzzz/fast-check/pull/6872)) Script: Rework hooks for Claude Code
- ([PR#6754](https://github.com/dubzzz/fast-check/pull/6754)) Test: Migrate race condition tests to Vitest
- ([PR#6859](https://github.com/dubzzz/fast-check/pull/6859)) Test: Stabilize flaky timeout tests on Windows
