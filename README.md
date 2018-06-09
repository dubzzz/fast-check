# fast-check
## Property based testing framework for JavaScript/TypeScript

[![Build Status](https://travis-ci.org/dubzzz/fast-check.svg?branch=master)](https://travis-ci.org/dubzzz/fast-check)
[![npm version](https://badge.fury.io/js/fast-check.svg)](https://badge.fury.io/js/fast-check)
[![total downloads](https://img.shields.io/npm/dt/fast-check.svg)](https://www.npmjs.com/package/fast-check)

[![Coverage Status](https://coveralls.io/repos/github/dubzzz/fast-check/badge.svg)](https://coveralls.io/github/dubzzz/fast-check)
[![Maintainability](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/maintainability)](https://codeclimate.com/github/dubzzz/fast-check/maintainability)
[![dependencies Status](https://david-dm.org/dubzzz/fast-check/status.svg)](https://david-dm.org/dubzzz/fast-check)
[![devDependencies Status](https://david-dm.org/dubzzz/fast-check/dev-status.svg)](https://david-dm.org/dubzzz/fast-check?type=dev)

----

[Getting started](#getting-started)

[Usage](#usage)

[Documentation](#documentation) \[[Generated TypeDoc](https://dubzzz.github.io/fast-check/)\]
- [Arbitraries](#arbitraries)
- [Custom arbitraries](#custom-arbitraries)
- [Properties](#properties)
- [Runners](#runners)

[Technical reference](#technical-reference)
- [Biased arbitraries](#biased-arbitraries)
- [Shrinking](#shrinking)

[Tips](#tips)
- [Opt for verbose failures](#opt-for-verbose-failures)
- [Preview generated values](#preview-generated-values)
- [Replay after failure](#replay-after-failure)

[Why should I migrate to fast-check?](#why-should-i-migrate-to-fast-check)

[Issues found by fast-check in famous packages](#issues-found-by-fast-check-in-famous-packages)

[Examples](https://github.com/dubzzz/fast-check/tree/master/example) - [Examples against REST API](https://github.com/dubzzz/fuzz-rest-api) - [More examples](https://github.com/dubzzz/fast-check-examples)

----

## Getting started

Install the module with: `npm install fast-check --save-dev`

Running examples in RunKit: https://runkit.com/dubzzz/fast-check-basic-examples

Property based testing explained:
- [John Hughes — Don’t Write Tests](https://www.youtube.com/watch?v=hXnS_Xjwk2Y)
- [Generating test cases so you don’t have to (Spotify)](https://labs.spotify.com/2015/06/25/rapid-check/)

If you want to synchronize and build the code locally:

```bash
git clone https://github.com/dubzzz/fast-check.git && cd fast-check
npm install
npm run prebuild #generate missing implementations: tuple and properties
npm run build    #compile the code in ./src, build the ./lib content
npm run test     #run unit tests
npm run e2e      #run end-to-end tests: check the code can shrink on errors, replay on failure...
```

## Usage

### In mocha or jasmine

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
    Error: Property failed after 1 tests (seed: 1527422598337, path: 0:0): ["","",""]
    Shrunk 1 time(s)
    Got error: Property failed by returning false

    Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
```

More on integration in:
[ava](https://github.com/dubzzz/fast-check-examples/blob/master/test-ava/example.spec.js),
[jasmine](https://github.com/dubzzz/fast-check-examples/blob/master/test-jasmine/example.spec.js),
[jest](https://github.com/dubzzz/fast-check-examples/blob/master/test-jest/example.spec.js),
[mocha](https://github.com/dubzzz/fast-check-examples/blob/master/test/longest%20common%20substr/test.js)
and
[tape](https://github.com/dubzzz/fast-check-examples/blob/master/test-tape/example.spec.js).

### In a web-page

In order to use fast-check from a web-page (for instance with QUnit or other testing tools), you have to reference the web-aware script as follow:

```html
<script src="https://cdn.jsdelivr.net/npm/fast-check/lib/bundle.js"></script>
```

You can also reference a precise version by setting the version you want in the url:

```html
<script src="https://cdn.jsdelivr.net/npm/fast-check@0.0.11/lib/bundle.js"></script>
```

Once it has been included, fast-check becomes accessible directly by calling `fastcheck` (in `window.fastcheck`). I highly recommend you to alias it by `fc` whenever possible by running `const fc = fastcheck` at the beginning of the scripts using it. 

## Documentation

### Properties

- `fc.property`: define a new property ie. a list of arbitraries and a test function to assess the success

The predicate would be considered falsy if its throws or if `output` evaluates to `false`.
```typescript
function property<T1>(
        arb1: Arbitrary<T1>,
        predicate: (t1:T1) => (boolean|void)): Property<[T1]>;
function property<T1,T2>(
        arb1: Arbitrary<T1>, arb2: Arbitrary<T2>,
        predicate: (t1:T1,t2:T2) => (boolean|void)): Property<[T1,T2]>;
...
```

- `fc.asyncProperty`: define a new property ie. a list of arbitraries and an asynchronous test function to assess the success

The predicate would be considered falsy if its throws or if `output` evaluates to `false` (after `await`).
```typescript
function asyncProperty<T1>(
        arb1: Arbitrary<T1>,
        predicate: (t1:T1) => Promise<boolean|void>): AsyncProperty<[T1]>;
function asyncProperty<T1,T2>(
        arb1: Arbitrary<T1>, arb2: Arbitrary<T2>,
        predicate: (t1:T1,t2:T2) => Promise<boolean|void>): AsyncProperty<[T1,T2]>;
...
```

**WARNING:**

> The predicate function must not change the inputs it received. If it needs to, it has to clone them before going on. Impacting the inputs might led to bad shrinking and wrong display on error.

> Nonetheless a failing property will still be a failing property.

### Runners

- `fc.assert`: run the property and throws in case of failure

**This function has to be awaited in case it is called on an asynchronous property.**

This function is ideal to be called in `describe`, `it` blocks.
It does not return anything in case of success.

It can be parametrized using its second argument.

```typescript
export interface Parameters {
    seed?: number;      // optional, initial seed of the generator: Date.now() by default
    numRuns?: number;   // optional, number of runs before success: 100 by default 
    timeout?: number;   // optional, only taken into account for asynchronous runs (asyncProperty)
                        // specify a timeout in milliseconds, maximum time for the predicate to return its result
                        // only works for async code, will not interrupt a synchronous code: disabled by default
    path?: string;      // optional, way to replay a failing property directly with the counterexample
                        // it can be fed with the counterexamplePath returned by the failing test (requires seed too)
    logger?: (v: string) => void; // optional, log output: console.log by default
    unbiased?: boolean; // optional, force the use of unbiased arbitraries: biased by default
    verbose?: boolean;  // optional, enable verbose mode: false by default
                        // when enabling verbose mode,
                        // you will be provided the list of all failing entries encountered
                        // whenever a property fails - useful to detect patterns
}
```

```typescript
function assert<Ts>(property: IProperty<Ts>, params?: Parameters);
```

- `fc.check`: run the property and return an object containing the test status along with other useful details

**This function has to be awaited in case it is called on an asynchronous property.**

It should never throw whatever the status of the test.

It can be parametrized with the same parameters than `fc.assert`.

The details returned by `fc.check` are the following:

```typescript
interface RunDetails<Ts> {
    failed: boolean,         // false in case of failure, true otherwise
    numRuns: number,         // number of runs (all runs if success, up and including the first failure if failed)
    numShrinks: number,      // number of shrinks (depth required to get the minimal failing example)
    seed: number,            // seed used for the test
    counterexample: Ts|null, // failure only: shrunk conterexample causig the property to fail
    counterexamplePath: string|null, // failure only: the exact path to re-run the counterexample
                                     // In order to replay the failing case directly,
                                     // this value as to be set as path attribute in the Parameters (with the seed)
                                     // of assert, check, sample or even statistics
    error: string|null,      // failure only: stack trace and error details
}
```

```typescript
function check<Ts>(property: IProperty<Ts>, params?: Parameters);
```

- `fc.sample`: sample generated values of an `Arbitrary<T>` or `Property<T>`

It builds an array containing all the values that would have been generated for the equivalent test.

It also accept `Parameters` as configuration in order to help you diagnose the shape of the inputs that will be received by your property.

```typescript
type Generator<Ts> = Arbitrary<Ts> | IProperty<Ts>;

function sample<Ts>(generator: Generator<Ts>): Ts[];
function sample<Ts>(generator: Generator<Ts>, params: Parameters): Ts[];
function sample<Ts>(generator: Generator<Ts>, numGenerated: number): Ts[];
```

- `fc.statistics`: classify the values produced by an `Arbitrary<T>` or `Property<T>`

It provides useful statistics concerning generated values.
In order to be able to gather those statistics it has to be provided with a classifier function that can classify the generated value in zero, one or more categories (free labels).

It also accept `Parameters` as configuration in order to help you diagnose the shape of the inputs that will be received by your property.

Statistics are dumped into `console.log` but can be redirected to another source by modifying the `logger` key in `Parameters`.

```typescript
type Generator<Ts> = Arbitrary<Ts> | IProperty<Ts>;
type Classifier<Ts> = ((v: Ts) => string) | ((v: Ts) => string[]);

function statistics<Ts>(generator: Generator<Ts>, classify: Classifier<Ts>): void;
function statistics<Ts>(generator: Generator<Ts>, classify: Classifier<Ts>, params: Parameters): void;
function statistics<Ts>(generator: Generator<Ts>, classify: Classifier<Ts>, numGenerated: number): void;
```

## Why should I migrate to fast-check?

`fast-check` has initially be designed in an attempt to cope with limitations I encountered while using other property based testing frameworks designed for JavaScript:

- strong and up-to-date types - *thanks to TypeScript*
- ability to shrink on `fc.oneof` - *unfortunately it is often not the case*
- easy `map` method to derive existing arbitraries while keeping shrink - *some frameworks ask the user to provide both a->b and b->a mappings in order to keep a shrinker*
- biased by default - *by default it generates both small and large values, making it easier to dig into counterexamples without having to tweak a size parameter manually*
- verbose mode - *easier troubleshooting with verbose mode enabled*
- replay directly on the minimal counterexample

## Issues found by fast-check in famous packages

`fast-check` has been able to find some unexpected behaviour among famous npm packages. Here are some of the errors detected using `fast-check`:

### [js-yaml](https://github.com/nodeca/js-yaml/)

**Issue detected:** enabling `!!int: binary` style when dumping negative integers produces invalid content \[[more](https://github.com/nodeca/js-yaml/pull/398)\]

**Code example:** `yaml.dump({toto: -10}, {styles:{'!!int':'binary'}})` produces `toto: 0b-1010` not `toto: -0b1010`

### [left-pad](https://github.com/stevemao/left-pad)

**Issue detected:** unicode characters outside of the BMP plan are not handled consistently \[[more](https://github.com/stevemao/left-pad/issues/58)\]

**Code example:**
```js
leftPad('a\u{1f431}b', 4, 'x') //=> 'a\u{1f431}b'  -- in: 3 code points, out: 3 code points
leftPad('abc', 4, '\u{1f431}') //=> '\u{1f431}abc' -- in: 3 code points, out: 4 code points
```

### [query-string](https://github.com/sindresorhus/query-string)

**Issue detected:** enabling the `bracket` setting when exporting arrays containing null values produces an invalid output for the parser \[[more](https://github.com/sindresorhus/query-string/pull/138)\]

**Code example:**
```js
m.stringify({bar: ['a', null, 'b']}, {arrayFormat: 'bracket'}) //=> "bar[]=a&bar&bar[]=b"
m.parse('bar[]=a&bar&bar[]=b', {arrayFormat: 'bracket'})       //=> {bar: [null, 'b']}
```
