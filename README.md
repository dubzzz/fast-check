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
