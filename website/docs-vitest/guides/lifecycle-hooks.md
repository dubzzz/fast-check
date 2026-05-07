---
sidebar_position: 3
slug: /guides/lifecycle-hooks/
title: Lifecycle hooks
description: How @fast-check/vitest plays with Vitest's beforeEach / afterEach lifecycle hooks.
---

# Lifecycle hooks: `beforeEach` / `afterEach`

Vitest's `beforeEach` and `afterEach` hooks are natively wired into
predicates. They are called respectively before and after each execution
of the predicate: if a predicate runs _n_ times, `beforeEach` runs _n_
times before it and `afterEach` runs _n_ times after it.

The only caveat is that cleanup functions returned by `beforeEach` on the
**first** predicate execution are deferred until the end of the test, as
they are handled by Vitest's own teardown mechanism. All other cleanups
run between predicate executions as expected.
