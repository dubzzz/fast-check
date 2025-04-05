---
title: What's new in fast-check 4.1.0?
authors: [dubzzz]
tags: [what's new, arbitrary, reliability]
---

With fast-check, reliability has always been at the heart of our mission. We strive to detect bugs that are not only rare but also extremely complex. With this release, we're making our scheduler even more effective — especially in scenarios that can realistically occur in production codebases. Our goal is for the scheduler to suggest as many execution orderings as possible, helping you surface those sneaky race conditions with confidence.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Pushing `waitFor` to the next level

The `fc.scheduler` arbitrary was built to help users uncover race conditions in their asynchronous code. We provide a [complete tutorial on how to use it](/docs/tutorials/detect-race-conditions/) in our documentation.

When you use fast-check’s scheduler, you get a tool capable of registering and releasing tasks. Among the various options to release them — `waitOne`, `waitAll` and `waitFor` — we’ve increasingly been encouraging users to rely on `waitFor`. Why? Because it is more explicit and it ensures that what you’re waiting for is truly done.

That said, we’ve now made it even better.

In some edge cases, `waitFor` sometimes failed to capture all tasks in time before releasing them. This could prevent an effective reordering of operations, particularly with already resolved promises. Let’s look at an example:

```js
async function abc(myapi) {
  return await myapi('abc');
}
async function def(caches, myapi) {
  const d = await caches.d;
  const e = await caches.e;
  const f = await caches.f;
  return await myapi(`${d}${e}${f}`);
}
```

And the test:

```js
// s is the scheduler provided by fast-check
const caches = {
  // our test focuses on caches being already resolved
  d: Promise.resolve('d'),
  e: Promise.resolve('e'),
  f: Promise.resolve('f'),
};
const myapi = fc.scheduleFunction(async (value) => value);
await s.waitFor(Promise.all([abc(myapi), def(caches, myapi)]));
// more code with expectations...
```

In previous versions, `waitFor` would consistently release the call `myapi('abc')` before `myapi('def')`. Why? Because it didn’t realize those `caches.*` promises were already resolved — and in JavaScript, micro-tasks (like already-resolved promises) have an higher priority compared to other standard asynchronous operations.

In fast-check 4.1.0, we now exhaust all resolved micro-tasks before proceeding to schedule tasks in `waitFor`. This leads to better task capture and more effective shuffling of execution orders — giving your tests a higher chance of uncovering subtle bugs.

## Changelog since 4.0.0

The version 4.1.0 is based on version 4.0.1, but let see what's changed since 4.0.0 itself.

### Features

- ([PR#5889](https://github.com/dubzzz/fast-check/pull/5889)) Wait longer before scheduling anything with `waitFor`
- ([PR#5892](https://github.com/dubzzz/fast-check/pull/5892)) Better capture scheduled tasks before running scheduling

### Fixes

- ([PR#5862](https://github.com/dubzzz/fast-check/pull/5862)) CI: Cache LFS files cross builds
- ([PR#5864](https://github.com/dubzzz/fast-check/pull/5864)) CI: Do not pull logo of README from LFS
- ([PR#5849](https://github.com/dubzzz/fast-check/pull/5849)) Doc: Drop link to rescript-fast-check
- ([PR#5865](https://github.com/dubzzz/fast-check/pull/5865)) Doc: Document our new Vitest proposal
- ([PR#5868](https://github.com/dubzzz/fast-check/pull/5868)) Doc: Adapt article on Vitest following feedback
- ([PR#5891](https://github.com/dubzzz/fast-check/pull/5891)) Performance: Move back to better tick management of `waitFor`
- ([PR#5888](https://github.com/dubzzz/fast-check/pull/5888)) Test: Closely test `waitFor` on interactions with micro-tasks
- ([PR#5735](https://github.com/dubzzz/fast-check/pull/5735)) Test: Run tests in workspace mode
