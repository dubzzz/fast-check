<h1 align="center">
  <img align="center" src="https://raw.githubusercontent.com/dubzzz/fast-check/main/logo/logo.png" alt="fast-check logo" />
</h1>

<p align="center">
Property based testing framework for JavaScript/TypeScript
</p>

<p align="center">
  <a href="https://github.com/dubzzz/fast-check/actions?query=branch%3Amain+workflow%3A%22Build+Status%22"><img src="https://github.com/dubzzz/fast-check/workflows/Build%20Status/badge.svg?branch=main" alt="Build Status" /></a>
  <a href="https://badge.fury.io/js/fast-check"><img src="https://badge.fury.io/js/fast-check.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/fast-check"><img src="https://img.shields.io/npm/dm/fast-check" alt="monthly downloads" /></a>
  <a href="https://dubzzz.github.io/fast-check/"><img src="https://img.shields.io/badge/-API Reference-%23282ea9.svg" title="API Reference" /></a>
</p>
<p align="center">
  <a href="https://app.codecov.io/gh/dubzzz/fast-check/branch/main"><img src="https://codecov.io/gh/dubzzz/fast-check/branch/main/graph/badge.svg" alt="Coverage Status (unit tests)" /></a>
  <a href="https://packagequality.com/#?package=fast-check"><img src="https://packagequality.com/shield/fast-check.svg" alt="Package quality" /></a>
  <a href="https://snyk.io/advisor/npm-package/fast-check"><img src="https://snyk.io/advisor/npm-package/fast-check/badge.svg" alt="Snyk Package quality" /></a>
</p>
<p align="center">
  <a href="https://github.com/dubzzz/fast-check/labels/good%20first%20issue"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
  <a href="https://github.com/dubzzz/fast-check/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/fast-check.svg" alt="License" /></a>
  <a href="https://twitter.com/intent/tweet?text=Check%20out%20fast-check%20by%20%40ndubien%20https%3A%2F%2Fgithub.com%2Fdubzzz%2Ffast-check%20%F0%9F%91%8D"><img src="https://img.shields.io/twitter/url/https/github.com/dubzzz/fast-check.svg?style=social" alt="Twitter" /></a>
</p>

## Getting started

Hands-on tutorial and definition of Property Based Testing: [🏁 see tutorial](https://github.com/dubzzz/fast-check/blob/main/documentation/HandsOnPropertyBased.md). Or directly try it online on our pre-configured [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/main/example?previewwindow=tests).

Property based testing frameworks check the truthfulness of properties. A property is a statement like: *for all (x, y, ...) such that precondition(x, y, ...) holds predicate(x, y, ...) is true*.

Install the module with: `yarn add fast-check --dev` or `npm install fast-check --save-dev`

Example of integration in [mocha](http://mochajs.org/):

```js
const fc = require('fast-check');

// Code under test
const contains = (text, pattern) => text.indexOf(pattern) >= 0;

// Properties
describe('properties', () => {
  // string text always contains itself
  it('should always contain itself', () => {
    fc.assert(fc.property(fc.string(), text => contains(text, text)));
  });
  // string a + b + c always contains b, whatever the values of a, b and c
  it('should always contain its substrings', () => {
    fc.assert(fc.property(fc.string(), fc.string(), fc.string(), (a,b,c) => {
      // Alternatively: no return statement and direct usage of expect or assert
      return contains(a+b+c, b);
    }));
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

Integration with other test frameworks: [ava](https://github.com/dubzzz/fast-check-examples/blob/main/test-ava/example.spec.js), [jasmine](https://github.com/dubzzz/fast-check-examples/blob/main/test-jasmine/example.spec.js), [jest](https://github.com/dubzzz/fast-check-examples/blob/main/test-jest/example.spec.js), [mocha](https://github.com/dubzzz/fast-check-examples/blob/main/test/longest%20common%20substr/test.js) and [tape](https://github.com/dubzzz/fast-check-examples/blob/main/test-tape/example.spec.js).

More examples: [simple examples](https://github.com/dubzzz/fast-check/tree/main/example), [fuzzing](https://github.com/dubzzz/fuzz-rest-api) and [against various algorithms](https://github.com/dubzzz/fast-check-examples).

Useful documentations:
- [🏁 Introduction to Property Based & Hands On](https://github.com/dubzzz/fast-check/blob/main/documentation/HandsOnPropertyBased.md)
- [🐣 Built-in arbitraries](https://github.com/dubzzz/fast-check/blob/main/documentation/Arbitraries.md)
- [🔧 Custom arbitraries](https://github.com/dubzzz/fast-check/blob/main/documentation/AdvancedArbitraries.md)
- [🏃‍♂️ Property based runners](https://github.com/dubzzz/fast-check/blob/main/documentation/Runners.md)
- [💥 Tips](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md)
- [🔌 API Reference](https://dubzzz.github.io/fast-check/)
- [⭐ Awesome fast-check](https://github.com/dubzzz/awesome-fast-check)
- [🤯 How fast-check works?](https://github.com/dubzzz/fast-check/blob/main/documentation/HowItWorks.md)

## Why should I migrate to fast-check?

fast-check has initially been designed in an attempt to cope with limitations I encountered while using other property based testing frameworks designed for JavaScript:

- **Types:** strong and up-to-date types - *thanks to TypeScript*
- **Extendable:** easy `map` method to derive existing arbitraries while keeping shrink \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/AdvancedArbitraries.md#transform-values)\] - *some frameworks ask the user to provide both a->b and b->a mappings in order to keep a shrinker*
- **Extendable:** kind of flatMap-operation called `chain` \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/AdvancedArbitraries.md#transform-arbitraries)\] - *able to bind the output of an arbitrary as input of another one while keeping the shrink working*
- **Extendable:** precondition checks with `fc.pre(...)` \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#filter-invalid-combinations-using-pre-conditions)\] - *filtering invalid entries can be done directly inside the check function if needed*
- **Smart:** ability to shrink on `fc.oneof` \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Arbitraries.md#combinors-of-arbitraries-t)\] - *surprisingly some frameworks don't*
- **Smart:** biased by default \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/AdvancedArbitraries.md#biased-arbitraries)\] - *by default it generates both small and large values, making it easier to dig into counterexamples without having to tweak a size parameter manually*
- **Debug:** verbose mode \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#opt-for-verbose-failures)\] - *easier troubleshooting with verbose mode enabled*
- **Debug:** replay directly on the minimal counterexample \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#replay-after-failure)\] - *no need to replay the whole sequence, you get directly the counterexample*
- **Debug:** custom examples in addition of generated ones \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#add-custom-examples-next-to-generated-ones)\] - *no need to duplicate the code to play the property on custom examples*
- **Debug:** logger per predicate run \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#log-within-a-predicate)\] - *simplify your troubleshoot with fc.context and its logging feature*
- **Unique:** model based approach \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#model-based-testing-or-ui-test)\]\[[article](https://medium.com/criteo-labs/detecting-the-unexpected-in-web-ui-fuzzing-1f3822c8a3a5)\] - *use the power of property based testing to test UI, APIs or state machines*
- **Unique:** detect race conditions in your code \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#detect-race-conditions)\] - *shuffle the way your promises and async calls resolve using the power of property based testing to detect races*
- **Unique:** simplify user definable corner cases \[[more](https://github.com/dubzzz/fast-check/blob/main/documentation/Tips.md#simplify-user-definable-corner-cases)\] - *simplify bug resolution by asking fast-check if it can find an even simpler corner case*

For more details, refer to the documentation in the links above.

## Compatibility

Here are the minimal requirements to use fast-check properly without any polyfills:

| fast-check | node                | ECMAScript version | _TypeScript (optional)_ |
|------------|---------------------|--------------------|-------------------------|
| **2.x**    | ≥8<sup>(1)</sup>    | ES2017             | ≥3.2                    |
| **1.x**    | ≥0.12<sup>(1)</sup> | ES3                | ≥3.0                    |

(1) Except for features that cannot be polyfilled - such as `bigint`-related ones - all the capabilities of fast-check should be usable given you use at least the minimal recommended version of node associated to your major of fast-check.

**ReScript bindings**


Bindings to use fast-check in [ReScript](https://rescript-lang.org) are available in package [rescript-fast-check](https://www.npmjs.com/rescript-fast-check). They are maintained by [@TheSpyder](https://github.com/TheSpyder) as an external project.

## Issues found by fast-check in famous packages

fast-check has been able to find some unexpected behaviour among famous npm packages. Here are some of the errors detected using fast-check:

**[jest](https://github.com/facebook/jest/)**

**Issue detected:** `toStrictEqual` fails to distinguish 0 from 5e-324 \[[more](https://github.com/facebook/jest/issues/7941)\]

**Code example:** `expect(0).toStrictEqual(5e-324)` succeeds

**[js-yaml](https://github.com/nodeca/js-yaml/)**

**Issue detected:** enabling `!!int: binary` style when dumping negative integers produces invalid content \[[more](https://github.com/nodeca/js-yaml/pull/398)\]

**Code example:** `yaml.dump({toto: -10}, {styles:{'!!int':'binary'}})` produces `toto: 0b-1010` not `toto: -0b1010`

**[query-string](https://github.com/sindresorhus/query-string)**

**Issue detected:** enabling the `bracket` setting when exporting arrays containing null values produces an invalid output for the parser \[[more](https://github.com/sindresorhus/query-string/pull/138)\]

**Code example:**
```js
m.stringify({bar: ['a', null, 'b']}, {arrayFormat: 'bracket'}) //=> "bar[]=a&bar&bar[]=b"
m.parse('bar[]=a&bar&bar[]=b', {arrayFormat: 'bracket'})       //=> {bar: [null, 'b']}
```

**[MORE: Issues detected thanks to fast-check](https://github.com/dubzzz/fast-check/blob/main/documentation/IssuesDiscovered.md)**

## Credits

**Code Contributors**

This project would not be the same without them 💖 - [Become one of them](CONTRIBUTING.md)

<a href="https://github.com/dubzzz/fast-check/graphs/contributors"><img src="https://opencollective.com/fast-check/contributors.svg?width=890&button=false" /></a>

**Backers**

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/fast-check/contribute)] and help us sustain our community.
<a href="https://opencollective.com/fast-check#backers"><img src="https://opencollective.com/fast-check/backers.svg?width=890"></a>

**Sponsors**

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/fast-check#sponsor)]

<a href="https://opencollective.com/fast-check/sponsor/0/website"><img src="https://opencollective.com/fast-check/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/1/website"><img src="https://opencollective.com/fast-check/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/2/website"><img src="https://opencollective.com/fast-check/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/3/website"><img src="https://opencollective.com/fast-check/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/4/website"><img src="https://opencollective.com/fast-check/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/5/website"><img src="https://opencollective.com/fast-check/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/6/website"><img src="https://opencollective.com/fast-check/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/7/website"><img src="https://opencollective.com/fast-check/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/8/website"><img src="https://opencollective.com/fast-check/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/fast-check/sponsor/9/website"><img src="https://opencollective.com/fast-check/sponsor/9/avatar.svg"></a>
