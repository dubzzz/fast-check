---
title: What's new in fast-check 4.8.0?
authors: [dubzzz]
tags: [release, chainUntil, combiners, arbitrary]
---

Nesting an arbitrary number of `.chain` calls has never been simple with fast-check. This release introduces `chainUntil`, a new combiner dedicated to iterative chaining. It runs as a loop, keeps going until you decide to stop and supports proper shrinking even on very long chains.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Iterative chaining with `chainUntil`

The new `chainUntil` arbitrary takes a starting arbitrary and a `chainer` function. It first generates a value from the starting arbitrary, then repeatedly calls `chainer` with the latest value to produce the next arbitrary in the chain. The loop stops as soon as `chainer` returns `undefined`,and the value emitted by `chainUntil` is the last one produced along the way.

```ts
fc.chainUntil(
  // Start from a tuple containing one value in 0..20,
  fc.nat(20).map((n) => [n]),
  // Then, if value is greater than 10, append another value in 0..20
  (tuple) => (tuple.at(-1) > 10 ? fc.nat(20).map((n) => [...tuple, n]) : undefined),
);
// Examples of generated values: [14,6], [2], [1], [20,2], [18,17,13,3]…
```

While doable with `.chain` it required nesting calls but the depth of the nesting has to be known upfront. With `chainUntil`, variable-length dependent generation is possible.

## Changelog since 4.7.0

The version 4.8.0 is based on version 4.7.0.

### Features

- ([PR#6678](https://github.com/dubzzz/fast-check/pull/6678)) Add `chainUntil` arbitrary for iterative chaining

### Fixes

- ([PR#6965](https://github.com/dubzzz/fast-check/pull/6965)) Bug: Restore ability not to use `skipLibCheck`
- ([PR#6877](https://github.com/dubzzz/fast-check/pull/6877)) CI: Lowercase discussion_category_name to "announcements"
- ([PR#6878](https://github.com/dubzzz/fast-check/pull/6878)) CI: Scope permissions of clean-caches
- ([PR#6880](https://github.com/dubzzz/fast-check/pull/6880)) CI: Add PR-authoring guidance for Claude
- ([PR#6887](https://github.com/dubzzz/fast-check/pull/6887)) CI: Delete CLAUDE.md
- ([PR#6888](https://github.com/dubzzz/fast-check/pull/6888)) CI: Use tilde ranges for security dependency overrides
- ([PR#6891](https://github.com/dubzzz/fast-check/pull/6891)) CI: Disable Renovate updates on pnpm overrides
- ([PR#6899](https://github.com/dubzzz/fast-check/pull/6899)) CI: Scope Claude hooks to `$CLAUDE_PROJECT_DIR`
- ([PR#6905](https://github.com/dubzzz/fast-check/pull/6905)) CI: Enable pnpm global virtual store
- ([PR#6933](https://github.com/dubzzz/fast-check/pull/6933)) CI: Pin pnpm in npm install commands
- ([PR#6932](https://github.com/dubzzz/fast-check/pull/6932)) CI: Grant `discussions: write` to release jobs
- ([PR#6935](https://github.com/dubzzz/fast-check/pull/6935)) CI: Skip PR template check for dubzzz
- ([PR#6937](https://github.com/dubzzz/fast-check/pull/6937)) CI: Mirror the repo to tangled
- ([PR#6938](https://github.com/dubzzz/fast-check/pull/6938)) CI: Add missing runs-on for tangled
- ([PR#6889](https://github.com/dubzzz/fast-check/pull/6889)) Doc: Add release notes for fast-check 4.7.0
- ([PR#6900](https://github.com/dubzzz/fast-check/pull/6900)) Doc: Fix broken API reference links
- ([PR#6844](https://github.com/dubzzz/fast-check/pull/6844)) Doc: Extract manual setup guide into dedicated page
- ([PR#6845](https://github.com/dubzzz/fast-check/pull/6845)) Doc: Add index pages for documentation sections
- ([PR#6918](https://github.com/dubzzz/fast-check/pull/6918)) Doc: Fix Documentation link to point to first doc page
- ([PR#6939](https://github.com/dubzzz/fast-check/pull/6939)) Doc: Link to Tangled mirror of fast-check
- ([PR#6934](https://github.com/dubzzz/fast-check/pull/6934)) Test: Tolerate `\p{...}` value drift in docs tests
- ([PR#6951](https://github.com/dubzzz/fast-check/pull/6951)) Test: Fix poisoning tests for latest Node
