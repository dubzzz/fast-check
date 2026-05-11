---
title: What's new in fast-check 4.8.0?
authors: [dubzzz]
tags: [release, chainUntil, combiners, arbitrary]
---

Building an arbitrary whose shape depends on previously generated values has always been possible through `.chain`. But `.chain` is one-shot by design: it lets you derive a single follow-up arbitrary from a previous value, and longer dependency chains had to be expressed by nesting `.chain` calls into each other. This release introduces `chainUntil`, a new combiner dedicated to iterative chaining. It runs as a loop, keeps going until you decide to stop, and supports proper shrinking even on very long chains.

Continue reading to explore the detailed updates it brings.

{/* truncate */}

## Iterative chaining with `chainUntil`

The new `chainUntil` arbitrary takes a starting arbitrary and a `chainer` function. It first generates a value from the starting arbitrary, then repeatedly calls `chainer` with the latest value to produce the next arbitrary in the chain. The loop stops as soon as `chainer` returns `undefined`, and the value emitted by `chainUntil` is the last one produced along the way.

```ts
fc.chainUntil(
  fc.nat(20).map((n) => [n]),
  (tuple) => (tuple[tuple.length - 1] > 10 ? fc.nat(20).map((n) => [...tuple, n]) : undefined),
);
// Start from a tuple containing one value in 0..20, then keep appending another
// value in 0..20 while the last appended value is greater than 10.
// Examples of generated values: [14,6], [2], [1], [20,2], [18,17,13,3]…
```

In other words, `chainUntil` makes it easy to model recurrences such as random walks that stop on a sentinel, growing a structure step by step, or replaying a sequence of state transitions until some condition is met.

## Why a dedicated combiner?

`chainUntil` covers scenarios that were awkward to express with the existing combiners:

- With `.chain`, expressing a multi-step dependency required nesting `.chain` calls into each other. The depth of those nestings had to be known statically, which made variable-length dependent generation hard to write.
- A naive recursive helper that calls `.chain` based on the value it just produced quickly hits the JavaScript call-stack limit on long chains, and recursion makes it harder to follow the flow.
- Shrinking is also tricky to get right when chaining manually. `.chain`'s shrinker has known [limitations](https://github.com/dubzzz/fast-check/issues/650#issuecomment-648397230) and stacking it on itself does not generally produce the smallest counterexamples.

`chainUntil` addresses all three points at once.

## Iterative under the hood

The implementation of `chainUntil` is fully iterative. Both generation and shrinking are written as loops over the chain entries. Each step records the arbitrary used, the value produced, its shrink context and a clone of the random number generator, so that the chain can be re-derived deterministically from any point.

When shrinking, fast-check walks the chain from its start. For each level, it asks the corresponding arbitrary for its shrink candidates, keeps the prefix unchanged, applies the candidate at the current level, and then re-runs the loop from the cloned random source to rebuild the rest of the chain. This means earlier (and usually structurally more impactful) decisions are explored first, and shrinking remains correct even when a smaller intermediate value yields a chain of a different length.

A practical consequence is that `chainUntil` handles chains with thousands of steps without blowing the stack, which used to be a real concern as soon as recursive chaining patterns were involved.

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
