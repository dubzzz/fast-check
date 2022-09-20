# `@fast-check/poisoning`

Set of utilities to ease detection and revert of poisoning

<a href="https://badge.fury.io/js/@fast-check%2Fpoisoning"><img src="https://badge.fury.io/js/@fast-check%2Fpoisoning.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/poisoning"><img src="https://img.shields.io/npm/dm/@fast-check%2Fpoisoning" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/poisoning/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fpoisoning.svg" alt="License" /></a>

---

## Why?

In JavaScript, "prototype poisoning" is one of the most common source for CVEs or zero days. It allows attackers to change the behaviour of some defaults like `Array.prototype.map`, `Map`, `Set`... so that they behave differently and can be leveraged for evil stuffs. This package can be used in addition to `fast-check` in order to detect poisoning that may occur during your property based tests.

## Easy to use

The package comes with:

- `assertNoPoisoning`: assert that the defaults known when first importing the package in your code have not been changed
- `restoreGlobals`: restore the defaults so that any change that could have been detected by `assertNoPoisoning` will be resolved

## Minimal requirements

- Node ≥8.0.0
