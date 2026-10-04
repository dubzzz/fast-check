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

Properties define predicates. They can be declared by calling `fc.asyncProperty(...arbitraries, predicate)`.

The syntax is the following:

```js
fc.asyncProperty(...arbitraries, (...args) => {});
```

When passing N arbitraries, the predicate will receive N arguments: first argument being produced by the first arbitrary, second argument by the second arbitrary...

The predicate can:

- either throw in case of failure by relying on `assert`, `expect` or even directly throwing,
- or return `true` or `undefined` for success and `false` for failure.

:::warning[Beware of side effects]
The predicate function should not change the inputs it received. If it needs to, it has to clone them before going on. Impacting the inputs might led to bad shrinking and wrong display on error.
:::

### Setup and teardown

Use the [life-cycle plugins](/docs/core-blocks/plugins/life-cycle/) to run setup or teardown steps around each execution of the predicate, including executions during shrinking. Pass them to `fc.assert` or `fc.check` via the `plugins` parameter.

```js
await fc.assert(
  fc.asyncProperty(...arbitraries, (...args) => {}),
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

Both plugins accept synchronous or asynchronous functions. The `beforeEach` plugin runs before the predicate, and the `afterEach` plugin runs afterward, including when the predicate fails. A `beforeEach` function can also return a teardown function.

:::info[Migration from property methods]
The `.beforeEach(...)` and `.afterEach(...)` methods on properties were removed in fast-check v5. Replace method chaining with the plugins shown above. Plugin callbacks do not receive a previous hook to call; compose hooks by adding plugins to the array.
:::

:::info[Independent]
Use either plugin on its own or combine both.
:::

:::tip[Share them]
Consider using `fc.installGlobalPlugin(fc.beforeEach(fn))` to share your hooks across multiple properties.
:::

### Example

Let's imagine we have a function called `crop` taking a string and the maximal length we accept. We can write the following property:

```js
fc.asyncProperty(fc.nat(), fc.string(), (maxLength, label) => {
  fc.pre(label.length <= maxLength); // any label such label.length > maxLength, will be dropped
  return crop(label, maxLength) === label; // true is success, false is failure
});
```

The property defined above is relying on `fc.pre` to filter out invalid entries and is returning boolean values to indicate failures.

It can also be written with `.filter` and `expect`:

```js
fc.asyncProperty(
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
