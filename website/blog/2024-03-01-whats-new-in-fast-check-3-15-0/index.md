---
title: What's new in fast-check 3.15.0?
authors: [dubzzz]
tags: [what's new]
---

This release added support for the parameter `depthIdentifier` on `dictionary`.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Recursive dictionary

The parameter `depthIdentifier` is a parameter to better control mutually recursive structures. When provided it helps users to better limit how deep the structure can go.

Generally speaking the identifier can either be an hardcoded string that you re-use between two or more arbitraries as follow:

```js
const recursive2 = fc.letrec((tie) => ({
  self: fc.dictionary(
    fc.string(),
    fc.oneof({ depthIdentifier: 'id', maxDepth: 1 }, tie('leaf'), tie('self')),
    { depthIdentifier: 'id' }, // we bind the two recursive levels together by referencing the same depthIdentifier
  ),
  leaf: fc.nat(),
})).self;
```

Or it can be uniquely constructed by calling `createDepthIdentifier` as follow:

```js
const depthIdentifier = fc.createDepthIdentifier();
const recursive2 = fc.letrec((tie) => ({
  self: fc.dictionary(
    fc.string(),
    fc.oneof({ depthIdentifier, maxDepth: 1 }, tie('leaf'), tie('self')),
    { depthIdentifier }, // we bind the two recursive levels together by referencing the same depthIdentifier
  ),
  leaf: fc.nat(),
})).self;
```

Have fun with recursive structures!

## Changelog since 3.14.0

The version 3.15.0 is based on version 3.14.0.

### Features

- ([PR#4548](https://github.com/dubzzz/fast-check/pull/4548)) Add support for `depthIdentifier` to `dictionary`

### Fixes

- ([PR#4502](https://github.com/dubzzz/fast-check/pull/4502)) Bug: Also produce null-prototype at root level of generated `object` when requested to
- ([PR#4481](https://github.com/dubzzz/fast-check/pull/4481)) CI: Migrate configuration of Docusaurus to TS
- ([PR#4463](https://github.com/dubzzz/fast-check/pull/4463)) Doc: Blog post for 3.14.0
- ([PR#4464](https://github.com/dubzzz/fast-check/pull/4464)) Doc: Prefer import notation over require for README
- ([PR#4482](https://github.com/dubzzz/fast-check/pull/4482)) Doc: Rework section on `waitAll` in the tutorial
- ([PR#4477](https://github.com/dubzzz/fast-check/pull/4477)) Doc: Fix typo in date.md
- ([PR#4494](https://github.com/dubzzz/fast-check/pull/4494)) Doc: Add new contributor bennettp123
- ([PR#4541](https://github.com/dubzzz/fast-check/pull/4541)) Refactor: Rely on `dictionary` for `object` instead of inlined reimplementation
- ([PR#4469](https://github.com/dubzzz/fast-check/pull/4469)) Test: More stable snapshot tests on stack traces
- ([PR#4470](https://github.com/dubzzz/fast-check/pull/4470)) Test: Add cause flag onto snapshot tests checking stack traces
- ([PR#4478](https://github.com/dubzzz/fast-check/pull/4478)) Test: Better snapshots tests implying stacktraces
- ([PR#4483](https://github.com/dubzzz/fast-check/pull/4483)) Test: Wrap async no-regression snapshots within a sanitizer for stacktraces
