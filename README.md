# fast-check

*Property based testing framework for JavaScript/TypeScript*

[![Build Status](https://travis-ci.org/dubzzz/fast-check.svg?branch=master)](https://travis-ci.org/dubzzz/fast-check)
[![npm version](https://badge.fury.io/js/fast-check.svg)](https://badge.fury.io/js/fast-check)
[![total downloads](https://img.shields.io/npm/dt/fast-check.svg)](https://www.npmjs.com/package/fast-check)

[![Coverage Status](https://coveralls.io/repos/github/dubzzz/fast-check/badge.svg)](https://coveralls.io/github/dubzzz/fast-check)
[![Maintainability](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/maintainability)](https://codeclimate.com/github/dubzzz/fast-check/maintainability)
[![dependencies Status](https://david-dm.org/dubzzz/fast-check/status.svg)](https://david-dm.org/dubzzz/fast-check)
[![devDependencies Status](https://david-dm.org/dubzzz/fast-check/dev-status.svg)](https://david-dm.org/dubzzz/fast-check?type=dev)

## Getting started

Property based testing frameworks check the truthfulness of properties. A property is a statement like: *for all (x, y, ...) such as precondition(x, y, ...) holds property(x, y, ...) is true*.

![Logo](https://raw.githubusercontent.com/dubzzz/fast-check/master/logo.png)

Install the module with: `npm install fast-check --save-dev`

Example of integration in [mocha](http://mochajs.org/):

```js
const fc = require('fast-check');

// Code under tests
const contains = (text, pattern) => text.indexOf(pattern) >= 0;

// Properties
describe('properties', () => {
  // string text always contains itself
  it('should always contain itself', () => {
    fc.assert(fc.property(fc.string(), text => contains(text, text)));
  });
  // string a + b + c always contains b, whatever the values of a, b and c
  it('should always contain its substrings', () => {
    fc.assert(fc.property(fc.string(), fc.string(), fc.string(), (a,b,c) => contains(a+b+c, b)));
  });
});
```

In case of failure, the test raises a red flag. Its output should help you to diagnose what went wrong in your implementation. Example with a failing implementation of contain:

```
1) should always contain its substrings
    Error: Property failed after 1 tests (seed: 1527422598337, path: 0:0): ["","",""]
    Shrunk 1 time(s)
    Got error: Property failed by returning false

    Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
```

Integration with other test frameworks:
[ava](https://github.com/dubzzz/fast-check-examples/blob/master/test-ava/example.spec.js),
[jasmine](https://github.com/dubzzz/fast-check-examples/blob/master/test-jasmine/example.spec.js),
[jest](https://github.com/dubzzz/fast-check-examples/blob/master/test-jest/example.spec.js),
[mocha](https://github.com/dubzzz/fast-check-examples/blob/master/test/longest%20common%20substr/test.js)
and
[tape](https://github.com/dubzzz/fast-check-examples/blob/master/test-tape/example.spec.js).

More examples:
[simple examples](https://github.com/dubzzz/fast-check/tree/master/example),
[fuzzing](https://github.com/dubzzz/fuzz-rest-api)
and
[against various algorithms](https://github.com/dubzzz/fast-check-examples).

Useful documentations:
- [:hatching_chick: Built-in arbitraries](https://github.com/dubzzz/fast-check/blob/master/documentation/Arbitraries.md)
- [:wrench: Custom arbitraries](https://github.com/dubzzz/fast-check/blob/master/documentation/AdvancedArbitraries.md)
- [:running_man: Property based runners](https://github.com/dubzzz/fast-check/blob/master/documentation/Runners.md)
- [:boom: Tips](https://github.com/dubzzz/fast-check/blob/master/documentation/Tips.md)
- [:mag: Generated documentation](https://dubzzz.github.io/fast-check/)

## In a web-page

In order to use fast-check from a web-page (for instance with QUnit or other testing tools), you have to reference the web-aware script as follow:

```html
<script src="https://cdn.jsdelivr.net/npm/fast-check/lib/bundle.js"></script>
```

You can also reference a precise version by setting the version you want in the url:

```html
<script src="https://cdn.jsdelivr.net/npm/fast-check@0.0.11/lib/bundle.js"></script>
```

Once it has been included, fast-check becomes accessible directly by calling `fastcheck` (in `window.fastcheck`). I highly recommend you to alias it by `fc` whenever possible by running `const fc = fastcheck` at the beginning of the scripts using it.

## Why should I migrate to fast-check?

fast-check has initially be designed in an attempt to cope with limitations I encountered while using other property based testing frameworks designed for JavaScript:

- strong and up-to-date types - *thanks to TypeScript*
- ability to shrink on `fc.oneof` - *unfortunately it is often not the case*
- easy `map` method to derive existing arbitraries while keeping shrink - *some frameworks ask the user to provide both a->b and b->a mappings in order to keep a shrinker*
- biased by default - *by default it generates both small and large values, making it easier to dig into counterexamples without having to tweak a size parameter manually*
- verbose mode - *easier troubleshooting with verbose mode enabled*
- replay directly on the minimal counterexample

## Issues found by fast-check in famous packages

fast-check has been able to find some unexpected behaviour among famous npm packages. Here are some of the errors detected using fast-check:

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
