---
title: What's new in fast-check 3.14.0?
authors: [dubzzz]
tags: [release, internal, performance]
---

This release changes the way we import type-only files internally in fast-check. While it should not have any visible impact on our clients we preferred to make it a minor.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Importing types

Everything started with barrel files...

When I read the article [Speeding up the JavaScript ecosystem - The barrel file debacle](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/), I asked myself: "What if I can make fast-check faster just by bundling it differently". And so I started to probe the (runtime) cost of importing fast-check differently.

The (still opened) issue [fast-check#4324](https://github.com/dubzzz/fast-check/issues/4324) has been created to start the investigation. I probed several setups against [Jest](https://jestjs.io/):

```js title="no-import.test.cjs"
test('empty test in spec file without any import', () => {});
// spec file execution took ~0.44s (4 runs: 0.436, 0.44, 0.441, 0.443)
```

```js title="current-import.test.cjs"
const fc = require('fast-check');
test('empty test in spec file with recommended import for fast-check', () => {
  fc; // no-op, just doing so to avoid bundlers from ignoring the import
});
// spec file execution took ~0.67s (4 runs: 0.677, 0.656, 0.7, 0.656)
```

```js title="future-import.test.cjs"
const { assert } = require('fast-check/assert');
test('empty test in spec file with recommended import for fast-check', () => {
  assert; // no-op, just doing so to avoid bundlers from ignoring the import
});
// spec file execution took ~0.47s (4 runs: 0.473, 0.475, 0.474, 0.473)
```

While these measurements need to be confirmed on more runs, they seem to highlight that the way to import can have an impact on the final users. That's said, we paused the ticket at that point. Indeed supporting `require` or `import` of a sub-path would require exports map in our package.json and would imply dropping support for old versions of Node and possibly requesting TypeScript's users to change a bit their configurations.

We actually not stopped totally! We went for the feasible part: we changed each internal import importing types to the `import type` syntax. It provided us a significant boost in the execution of our own tests. From a client point-of-view, it might not have that much impact but given the fact it played on bundling tricks, we preferred to make it a minor version.

## Changelog since 3.13.0

The version 3.14.0 is based on version 3.13.2, but let see what's changed since 3.13.0 itself.

### Features

- ([PR#4426](https://github.com/dubzzz/fast-check/pull/4426)) Prefer "import type" over raw "import"

### Fixes

- ([PR#4344](https://github.com/dubzzz/fast-check/pull/4344)) Bug: Path wrongly reported when invalid
- ([PR#4261](https://github.com/dubzzz/fast-check/pull/4261)) Bug: Fix typings for node native esm
- ([PR#4364](https://github.com/dubzzz/fast-check/pull/4364)) CI: Toggle more immutable on yarn
- ([PR#4369](https://github.com/dubzzz/fast-check/pull/4369)) CI: Do not override existing on untar
- ([PR#4372](https://github.com/dubzzz/fast-check/pull/4372)) CI: REVERT Do not override existing on untar
- ([PR#4371](https://github.com/dubzzz/fast-check/pull/4371)) CI: Mark final check as failed and not skipped
- ([PR#4375](https://github.com/dubzzz/fast-check/pull/4375)) CI: Attempt to patch untar step
- ([PR#4378](https://github.com/dubzzz/fast-check/pull/4378)) CI: Attempt to patch untar step
- ([PR#4380](https://github.com/dubzzz/fast-check/pull/4380)) CI: Add missing but directly called dependencies
- ([PR#4384](https://github.com/dubzzz/fast-check/pull/4384)) CI: Attempt to patch untar step
- ([PR#4368](https://github.com/dubzzz/fast-check/pull/4368)) CI: Attempt to switch to pnp linker
- ([PR#4407](https://github.com/dubzzz/fast-check/pull/4407)) CI: No parallel "git" command
- ([PR#4419](https://github.com/dubzzz/fast-check/pull/4419)) CI: Prefer "import type" via linter
- ([PR#4428](https://github.com/dubzzz/fast-check/pull/4428)) CI: Default to Node 20 for CI
- ([PR#4441](https://github.com/dubzzz/fast-check/pull/4441)) CI: Add support for PnP on VSCode
- ([PR#4279](https://github.com/dubzzz/fast-check/pull/4279)) CI: Better caching for yarn
- ([PR#4346](https://github.com/dubzzz/fast-check/pull/4346)) CI: Better yarn caching in CI
- ([PR#4347](https://github.com/dubzzz/fast-check/pull/4347)) CI: Avoid yarn install on "cache hit"
- ([PR#4348](https://github.com/dubzzz/fast-check/pull/4348)) CI: Create job to confirm all passed
- ([PR#4352](https://github.com/dubzzz/fast-check/pull/4352)) CI: Skip install on hot cache (win/mac)
- ([PR#4299](https://github.com/dubzzz/fast-check/pull/4299)) Doc: Article around Zod vulnerability
- ([PR#4306](https://github.com/dubzzz/fast-check/pull/4306)) Doc: Fixing a typos in Zod article
- ([PR#4307](https://github.com/dubzzz/fast-check/pull/4307)) Doc: Add missing robots.txt
- ([PR#4356](https://github.com/dubzzz/fast-check/pull/4356)) Doc: Better document limitations of `gen`
- ([PR#4230](https://github.com/dubzzz/fast-check/pull/4230)) Doc: Release note for 3.13.0
- ([PR#4240](https://github.com/dubzzz/fast-check/pull/4240)) Doc: Some tips on prototype pollution
- ([PR#4246](https://github.com/dubzzz/fast-check/pull/4246)) Doc: Fix typo in "Detect prototype pollution automatically"
- ([PR#4345](https://github.com/dubzzz/fast-check/pull/4345)) Performance: Faster replay: drop loose compare
- ([PR#4381](https://github.com/dubzzz/fast-check/pull/4381)) Test: Import buffer via aliased name
- ([PR#4270](https://github.com/dubzzz/fast-check/pull/4270)) Test: Check tsc import and types of bundled package
- ([PR#4271](https://github.com/dubzzz/fast-check/pull/4271)) Test: Typecheck ESM bundle correctly
- ([PR#4269](https://github.com/dubzzz/fast-check/pull/4269)) Test: Rework checks against legacy node
- ([PR#4338](https://github.com/dubzzz/fast-check/pull/4338)) Script: Faster tests execution with babel
