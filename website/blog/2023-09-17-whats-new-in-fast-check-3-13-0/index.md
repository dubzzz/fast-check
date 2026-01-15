---
title: What's new in fast-check 3.13.0?
authors: [dubzzz]
tags: [release, dates, edge-cases]
---

This release introduces some new opt-in options on `date`, `dictionary` and `record`. They open ways to detect new classes of bugs.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Mission

The main target of fast-check has always been to find bugs without too much help of the testers. Instead of forcing you to think about the possible things that can go wrong, fast-check asks you to explain what to expect from your algorithms and it should find what goes wrong for you.

As such, the more fast-check thinks about nasty things, the higher the chance to detect bugs that may happen in production before you.

Since version 3.0.0, we have started to push more and more for defaults enabling everything. For instance, `double` not only generates classical numerical values but also infinities, not-a-number or negative zero.

This new release goes in the same direction, by preparing the ground for version 4.0.0 to enable even more defaults immediately. So far they are opt-ins while they will be opt-outs starting in the next major.

## Invalid date

In JavaScript, an _invalid date_ is a date. When building dates out of strings, it is common to fall onto invalid dates. If not captured early enough, they might blow your algorithms.

With version 3.13.0, we added the ability to generate such dates directly from the `date` arbitrary:

```ts
fc.date({ noInvalidDate: false });
// in v3, you'll have to set the option explicitly to false
```

## Null prototype

Most objects inherit from the prototype of `Object` but not all. By inheriting from it, they make users able to call methods such as `toString` or `hasOwnProperty` on them (and many others).

You don't have these methods on an instance created using:

```ts
const instance = Object.create(null);
```

Starting at 3.13.0, we want to make our users able to build instances without any prototype for `dictionary` and `record`. Such instances have many benefits over raw objects and being able to deal with them is key.

Now, you can request `dictionary` and `record` to generate such prototype-less instances via:

```ts
fc.dictionary(
  fc.string(), // the keys
  fc.nat(), // the values
  { noNullPrototype: false },
);
// in v3, you'll have to set the option explicitly to false

fc.record(
  {
    keyA: fc.nat(), // the keys for our records (here: keyA and keyB)
    keyB: fc.string(), // and associated values (here: nat and string)
  },
  { noNullPrototype: false },
);
// in v3, you'll have to set the option explicitly to false
```

## Changelog since 3.12.0

The version 3.13.0 is based on version 3.12.1.

### Features

- ([PR#4197](https://github.com/dubzzz/fast-check/pull/4197)) Add support for "Invalid Date" in `date`
- ([PR#4203](https://github.com/dubzzz/fast-check/pull/4203)) Deprecate `withDeletedKeys` on `record`
- ([PR#4204](https://github.com/dubzzz/fast-check/pull/4204)) Support null-proto in `dictionary`
- ([PR#4205](https://github.com/dubzzz/fast-check/pull/4205)) Support null-proto in `record`

### Fixes

- ([PR#4172](https://github.com/dubzzz/fast-check/pull/4172)) Bug: Better declare ESM's types
- ([PR#4177](https://github.com/dubzzz/fast-check/pull/4177)) Bug: Replace macros in published esm types
- ([PR#4207](https://github.com/dubzzz/fast-check/pull/4207)) Bug: Better poisoning resiliency for `dictionary`
- ([PR#4156](https://github.com/dubzzz/fast-check/pull/4156)) CI: Stop formatting built website
- ([PR#4155](https://github.com/dubzzz/fast-check/pull/4155)) CI: Add TypeScript checks on website
- ([PR#4171](https://github.com/dubzzz/fast-check/pull/4171)) CI: Update Devcontainer settings
- ([PR#4181](https://github.com/dubzzz/fast-check/pull/4181)) CI: Add exempted labels for stale bot
- ([PR#4194](https://github.com/dubzzz/fast-check/pull/4194)) CI: Add some more details onto the PWA
- ([PR#4211](https://github.com/dubzzz/fast-check/pull/4211)) CI: Rework broken test on `date`
- ([PR#4212](https://github.com/dubzzz/fast-check/pull/4212)) CI: Rework broken test on `date` (retry)
- ([PR#4214](https://github.com/dubzzz/fast-check/pull/4214)) CI: Rework another broken test on date
- ([PR#4136](https://github.com/dubzzz/fast-check/pull/4136)) Clean: Drop dependency @testing-library/jest-dom
- ([PR#4107](https://github.com/dubzzz/fast-check/pull/4107)) Doc: What's new article for fast-check 3.12.0
- ([PR#4118](https://github.com/dubzzz/fast-check/pull/4118)) Doc: Drop raw bench results from release note
- ([PR#4186](https://github.com/dubzzz/fast-check/pull/4186)) Doc: Document our approach to dual package
- ([PR#4187](https://github.com/dubzzz/fast-check/pull/4187)) Doc: Expose website as PWA too
- ([PR#4190](https://github.com/dubzzz/fast-check/pull/4190)) Move: Move the manifest in /static
- ([PR#4206](https://github.com/dubzzz/fast-check/pull/4206)) Refactor: Re-use null-proto helpers of `dictionary` on `anything`
- ([PR#4117](https://github.com/dubzzz/fast-check/pull/4117)) Test: Stabilize test related to NaN in exclusive mode
- ([PR#4189](https://github.com/dubzzz/fast-check/pull/4189)) Test: Drop Node 14.x from the test-chain
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting
