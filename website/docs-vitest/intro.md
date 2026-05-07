---
sidebar_position: 1
slug: /
title: Introduction
description: The official fast-check plugin for Vitest — property-based testing made easy.
---

# @fast-check/vitest

`@fast-check/vitest` is the official Vitest plugin for the
[fast-check](/docs/introduction/) property-based testing framework. It
wires fast-check's input generation and shrinking directly into
[Vitest](https://vitest.dev/)'s `test` / `it` API, staying fully
compatible with Vitest's runner, hooks, and reporters.

## Two modes, one package

- **One-time random mode** — extends Vitest's `test` / `it` with a
  reproducible random generator. Great for sprinkling controlled
  randomness into example-based tests without running each case hundreds
  of times.
- **Full property-based mode** — `test.prop` / `it.prop` run a predicate
  over many generated inputs and shrink counter-examples on failure.

## Where to go next

- [Getting started](./getting-started.md) — install and write your first test.
- [One-time random mode](./guides/one-time-random-mode.md)
- [Full property-based mode](./guides/property-based-mode.md)
- [Lifecycle hooks](./guides/lifecycle-hooks.md)
- [Compatibility](./compatibility.md)
