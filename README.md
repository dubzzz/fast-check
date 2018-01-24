# Fast Check
##### Yet another property based testing framework _BUT_ written in TypeScript

[![Build Status](https://travis-ci.org/dubzzz/fast-check.svg?branch=master)](https://travis-ci.org/dubzzz/fast-check)
[![npm version](https://badge.fury.io/js/fast-check.svg)](https://badge.fury.io/js/fast-check)
[![dependencies Status](https://david-dm.org/dubzzz/fast-check/status.svg)](https://david-dm.org/dubzzz/fast-check)
[![devDependencies Status](https://david-dm.org/dubzzz/fast-check/dev-status.svg)](https://david-dm.org/dubzzz/fast-check?type=dev)

[![Coverage Status](https://coveralls.io/repos/github/dubzzz/fast-check/badge.svg)](https://coveralls.io/github/dubzzz/fast-check)
[![Test Coverage](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/test_coverage)](https://codeclimate.com/github/dubzzz/fast-check/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/maintainability)](https://codeclimate.com/github/dubzzz/fast-check/maintainability)

## Getting started

Install the module with: `npm install fast-check`

## Usage

Using fast-check with [mocha](http://mochajs.org/) is really straightfoward.
It can be used directly in `describe`, `it` blocks with no extra care.

The following snippets written in Javascript shows an example featuring two properties:

```js
const fc = require('fast-check');

// Code under tests
const contains = (text, pattern) => text.indexOf(pattern) >= 0;

// Properties
describe('properties', () => {
    it('should always contain itself', () => {
        fc.assert(fc.property(fc.string(), text => contains(text, text)));
    });
    it('should always contain its substrings', () => {
        fc.assert(fc.property(fc.string(), fc.string(), fc.string(), (a,b,c) => contains(a+b+c, b)));
    });
});
```

In case of failure, the tests would raise a red flag and the output should help you to diagnose what went wrong in your implementation (example with a failing implementation of contain):

```
1) should always contain its substrings
    Property failed after 1 tests (seed: 1515709471288): [,,]
    Got error: Property failed by returning false
```

## Documentation

### Properties

- `fc.property`: define a new property ie. a list of arbitraries and a test function to assess the success

The predicate would be considered falsy if its throws or if `output == null || output == true` evaluate to `false`.
```typescript
function property<T1>(
        arb1: Arbitrary<T1>,
        predicate: (t1:T1) => (boolean|void)): Property<[T1]>;
function property<T1,T2>(
        arb1: Arbitrary<T1>, arb2: Arbitrary<T2>,
        predicate: (t1:T1,t2:T2) => (boolean|void)): Property<[T1,T2]>;
...
```

## Runners

- `fc.assert`: run the property and throws in case of failure

This function is ideal to be called in `describe`, `it` blocks.
It does not return anything in case of success.

It can be parametrized using its second argument.

```typescript
export interface Parameters {
    seed?: number;     // optional, initial seed of the generator: Date.now() by default
    num_runs?: number; // optional, number of runs before success: 100 by default 
}
```

```typescript
function assert<Ts>(property: IProperty<Ts>, params?: Parameters);
```

- `fc.check`: run the property and return an object containing the test status along with other useful details

It should never throw whatever the status of the test.

It can be parametrized with the same parameters than `fc.assert`.

The details returned by `fc.check` are the following:

```typescript
interface Details {
    boolean: failed: false, // false in case of failure, true otherwise
    number: num_runs,    // number of runs (all runs if success, up and including the first failure if failed)
    number: num_shrinks, // number of shrinks (depth required to get the minimal failing example)
    number: seed,        // seed used for the test
    Ts?: counterexample, // failure only: shrunk conterexample causig the property to fail
    string?: error       // failure only: stack trace and error details
}
```

```typescript
function check<Ts>(property: IProperty<Ts>, params?: Parameters);
```

## Arbitraries

Arbitraries are responsible for the random generation (but deterministic) and shrink of datatypes.
They can be combined together to build more complex datatypes.

### Boolean (:boolean)

- `fc.boolean()` either `true` or `false`

### Numeric (:number)

Integer values:

- `fc.integer()` all possible integers ie. from -2147483648 (included) to 2147483647 (included)
- `fc.integer(max: number)` all possible integers between -2147483648 (included) and max (included)
- `fc.integer(min: number, max: number)` all possible integers between min (included) and max (included)
- `fc.nat()` all possible positive integers ie. from 0 (included) to 2147483647 (included)
- `fc.nat(max: number)` all possible positive integers between 0 (included) and max (included)

Floating point numbers:

- `fc.float()` uniformly distributed `float` value between 0.0 (included) and 1.0 (excluded)
- `fc.double()`uniformly distributed `double` value between 0.0 (included) and 1.0 (excluded)

### String (:string)

Single character only:

- `fc.hexa()` one character in `0123456789abcdef` (lower case)
- `fc.base64()` one character in `A-Z`, `a-z`, `0-9`, `+` or `/`
- `fc.char()` between 0x20 (included) and 0x7e (included) , corresponding to printable characters (see https://www.ascii-code.com/)
- `fc.ascii()` between 0x00 (included) and 0x7f (included)
- `fc.unicode()` between 0x0000 (included) and 0xffff (included)

Multiple characters:

- `fc.hexaString()` or `fc.hexaString(maxLength: number)` string based on characters generated by `fc.hexa()`
- `fc.base64String()` or `fc.base64String(maxLength: number)` string based on characters generated by `fc.base64()`. Provide valid base 64 strings: length always multiple of 4 padded with '=' characters
- `fc.string()` or `fc.string(maxLength: number)` string based on characters generated by `fc.char()`
- `fc.asciiString()` or `fc.asciiString(maxLength: number)` string based on characters generated by `fc.ascii()`
- `fc.unicodeString()` or `fc.unicodeString(maxLength: number)` string based on characters generated by `fc.unicode()`

Strings that mimic real strings, with words and sentences:

- `fc.lorem()`, `fc.lorem(maxWordsCount: number)` or `fc.lorem(maxWordsCount: number, sentencesMode: boolean)` lorem ipsum strings. Generator can be configured by giving it a maximum number of characters by using `maxWordsCount` or switching the mode to sentences by setting `sentencesMode` to `true` in which case `maxWordsCount` is used to cap the number of sentences allowed
