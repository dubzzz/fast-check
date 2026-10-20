---
sidebar_position: 2
slug: /core-blocks/properties/
---

# Properties

Define your properties.

## Introduction

Properties bring together arbitrary generators and predicates. They are a key building block for property based testing frameworks.

They can be summarized by:

> for any (x, y, ...)  
> such that precondition(x, y, ...) holds  
> predicate(x, y, ...) is true

:::info[Equivalence in fast-check]
Each part of the definition can be achieved directly within fast-check:

- "_for any (x, y, ...)_" via [arbitraries](/docs/core-blocks/arbitraries/primitives/number/)
- "_such that precondition(x, y, ...) holds_" via `fc.pre` or `.filter`
- "_predicate(x, y, ...) is true_" via the predicate

:::

## Properties

### Basic

Properties define predicates. They can be declared by calling `fc.property(...arbitraries, predicate)`.

The syntax is the following:

```js
fc.property(...arbitraries, (...args) => {});
```

When passing N arbitraries, the predicate receives N generated values in the same order, followed by an execution context. You can omit the context parameter when you do not need it.

The predicate can:

- either throw in case of failure by relying on `assert`, `expect` or even directly throwing,
- or return `true` or `undefined` for success and `false` for failure.

Predicates can be synchronous or asynchronous. Use `fc.property` for both, and always await `fc.assert` or `fc.check` when running them:

```js
await fc.assert(fc.property(fc.string(), (value) => typeof value === 'string'));

await fc.assert(
  fc.property(fc.string(), async (value) => {
    await checkValue(value);
  }),
);
```

:::warning[Beware of side effects]
The predicate function should not change the inputs it received. If it needs to, it has to clone them before going on. Impacting the inputs might led to bad shrinking and wrong display on error.
:::

### Setup and teardown

Use the [life-cycle plugins](/docs/core-blocks/plugins/life-cycle/) to run setup or teardown steps around each execution of the predicate, including executions during shrinking. Pass them to `fc.assert` or `fc.check` via the `plugins` parameter.

```js
await fc.assert(
  fc.property(...arbitraries, (...args) => {}),
  {
    plugins: [
      fc.beforeEach(() => {
        // Set up state for this execution of the predicate.
      }),
      fc.afterEach(() => {
        // Clean up state after this execution of the predicate.
      }),
    ],
  },
);
```

Both plugins accept synchronous or asynchronous functions.

- The `beforeEach` plugin runs before the predicate. The function it get passed can either return nothing or a teardown function that will be called after the predicate, whatever its status.
- The `afterEach` plugin runs after the predicate, whatever its status.

:::tip[Share them]
Consider using `fc.installGlobalPlugin(fc.beforeEach(fn))` to share your hooks across multiple properties.
:::

### Example

Let's imagine we have a function called `crop` taking a string and the maximal length we accept. We can write the following property:

```js
fc.property(fc.nat(), fc.string(), (maxLength, label) => {
  fc.pre(label.length <= maxLength); // any label such label.length > maxLength, will be dropped
  return crop(label, maxLength) === label; // true is success, false is failure
});
```

The property defined above is relying on `fc.pre` to filter out invalid entries and is returning boolean values to indicate failures.

It can also be written with `.filter` and `expect`:

```js
fc.property(
  fc
    .record({
      maxLength: fc.nat(),
      label: fc.string(),
    })
    .filter(({ maxLength, label }) => label.length <= maxLength),
  ({ maxLength, label }) => {
    expect(crop(label, maxLength)).toBe(label);
  },
);
```

:::info[Filtering and performance]
Whatever the filtering solution you chose between `fc.pre` or `.filter`, they both consist into generating values and then dropping them. When filter is too strict it means that plenty of values could be rejected for only a few kept.

As a consequence, whenever feasible it's recommended to prefer relying on options directly providing by the arbitraries rather than filtering them. For instance, if you want to generate strings having at least two characters you should prefer `fc.string({ minLength: 2 })` over `fc.string().filter(s => s.length >= 2)`.
:::
