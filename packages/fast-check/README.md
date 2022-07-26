<h1 align="center">
  <img align="center" src="https://raw.githubusercontent.com/dubzzz/fast-check/main/packages/fast-check/documentation/images/logo.png" alt="fast-check logo" />
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

Hands-on tutorial and definition of Property Based Testing: [🏁 see tutorial](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/HandsOnPropertyBased.md). Or directly try it online on our pre-configured [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/main/examples?previewwindow=tests).

Property based testing frameworks check the truthfulness of properties. A property is a statement like: _for all (x, y, ...) such that precondition(x, y, ...) holds predicate(x, y, ...) is true_.

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
    fc.assert(fc.property(fc.string(), (text) => contains(text, text)));
  });
  // string a + b + c always contains b, whatever the values of a, b and c
  it('should always contain its substrings', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        // Alternatively: no return statement and direct usage of expect or assert
        return contains(a + b + c, b);
      })
    );
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

More examples: [simple examples](https://github.com/dubzzz/fast-check/tree/main/examples), [fuzzing](https://github.com/dubzzz/fuzz-rest-api) and [against various algorithms](https://github.com/dubzzz/fast-check-examples).

Useful documentations:

- [🏁 Introduction to Property Based & Hands On](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/HandsOnPropertyBased.md)
- [🐣 Built-in arbitraries](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Arbitraries.md)
- [🔧 Custom arbitraries](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/AdvancedArbitraries.md)
- [🏃‍♂️ Property based runners](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Runners.md)
- [💥 Tips](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md)
- [🔌 API Reference](https://dubzzz.github.io/fast-check/)
- [⭐ Awesome fast-check](https://github.com/dubzzz/awesome-fast-check)
- [🤯 How fast-check works?](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/HowItWorks.md)

## Why should I migrate to fast-check?

fast-check has initially been designed in an attempt to cope with limitations I encountered while using other property based testing frameworks designed for JavaScript:

- **Types:** strong and up-to-date types - _thanks to TypeScript_
- **Extendable:** easy `map` method to derive existing arbitraries while keeping shrink \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/AdvancedArbitraries.md#transform-values)\] - _some frameworks ask the user to provide both a->b and b->a mappings in order to keep a shrinker_
- **Extendable:** kind of flatMap-operation called `chain` \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/AdvancedArbitraries.md#transform-arbitraries)\] - _able to bind the output of an arbitrary as input of another one while keeping the shrink working_
- **Extendable:** precondition checks with `fc.pre(...)` \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#filter-invalid-combinations-using-pre-conditions)\] - _filtering invalid entries can be done directly inside the check function if needed_
- **Smart:** ability to shrink on `fc.oneof` \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Arbitraries.md#combinors-of-arbitraries-t)\] - _surprisingly some frameworks don't_
- **Smart:** biased by default \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/AdvancedArbitraries.md#biased-arbitraries)\] - _by default it generates both small and large values, making it easier to dig into counterexamples without having to tweak a size parameter manually_
- **Debug:** verbose mode \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#opt-for-verbose-failures)\] - _easier troubleshooting with verbose mode enabled_
- **Debug:** replay directly on the minimal counterexample \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#replay-after-failure)\] - _no need to replay the whole sequence, you get directly the counterexample_
- **Debug:** custom examples in addition of generated ones \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#add-custom-examples-next-to-generated-ones)\] - _no need to duplicate the code to play the property on custom examples_
- **Debug:** logger per predicate run \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#log-within-a-predicate)\] - _simplify your troubleshoot with fc.context and its logging feature_
- **Unique:** model based approach \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#model-based-testing-or-ui-test)\]\[[article](https://medium.com/criteo-labs/detecting-the-unexpected-in-web-ui-fuzzing-1f3822c8a3a5)\] - _use the power of property based testing to test UI, APIs or state machines_
- **Unique:** detect race conditions in your code \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#detect-race-conditions)\] - _shuffle the way your promises and async calls resolve using the power of property based testing to detect races_
- **Unique:** simplify user definable corner cases \[[more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Tips.md#simplify-user-definable-corner-cases)\] - _simplify bug resolution by asking fast-check if it can find an even simpler corner case_

For more details, refer to the documentation in the links above.

### Trusted

fast-check has been trusted for years by big projects like: [jest](https://github.com/facebook/jest), [jasmine](https://github.com/jasmine/jasmine), [fp-ts](https://github.com/gcanti/fp-ts), [io-ts](https://github.com/gcanti/io-ts), [ramda](https://github.com/ramda/ramda), [js-yaml](https://github.com/nodeca/js-yaml), [query-string](https://github.com/sindresorhus/query-string)...

### Powerful

It also proved useful in finding bugs among major open source projects such as [jest](https://github.com/facebook/jest), [query-string](https://github.com/sindresorhus/query-string)... and [many others](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/IssuesDiscovered.md).

## Compatibility

Here are the minimal requirements to use fast-check properly without any polyfills:

| fast-check | node                | ECMAScript version | _TypeScript (optional)_ |
| ---------- | ------------------- | ------------------ | ----------------------- |
| **3.x**    | ≥8<sup>(1)</sup>    | ES2017             | ≥4.1<sup>(2)</sup>      |
| **2.x**    | ≥8<sup>(1)</sup>    | ES2017             | ≥3.2<sup>(3)</sup>      |
| **1.x**    | ≥0.12<sup>(1)</sup> | ES3                | ≥3.0<sup>(3)</sup>      |

<details>
<summary>More details...</summary>

1. Except for features that cannot be polyfilled - such as `bigint`-related ones - all the capabilities of fast-check should be usable given you use at least the minimal recommended version of node associated to your major of fast-check.
2. Require either lib or target ≥ ES2020 or `@types/node` to be installed.
3. Require either lib or target ≥ ES2015 or `@types/node` to be installed.

</details>

### ReScript bindings

Bindings to use fast-check in [ReScript](https://rescript-lang.org) are available in package [rescript-fast-check](https://www.npmjs.com/rescript-fast-check). They are maintained by [@TheSpyder](https://github.com/TheSpyder) as an external project.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/dubzzz"><img src="https://avatars.githubusercontent.com/u/5300235?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas DUBIEN</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=dubzzz" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=dubzzz" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=dubzzz" title="Tests">⚠️</a> <a href="#infra-dubzzz" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#design-dubzzz" title="Design">🎨</a> <a href="#maintenance-dubzzz" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://github.com/hath995"><img src="https://avatars.githubusercontent.com/u/381037?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aaron Elligsen</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=hath995" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=hath995" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=hath995" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/willheslam"><img src="https://avatars.githubusercontent.com/u/5377213?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Will Heslam</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=willheslam" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/kazchimo"><img src="https://avatars.githubusercontent.com/u/31263328?v=4?s=100" width="100px;" alt=""/><br /><sub><b>kazchimo</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=kazchimo" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=kazchimo" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/brandon-leapyear"><img src="https://avatars.githubusercontent.com/u/27799541?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brandon Chinn</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=brandon-leapyear" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=brandon-leapyear" title="Documentation">📖</a></td>
    <td align="center"><a href="http://safareli.github.io/resume/"><img src="https://avatars.githubusercontent.com/u/1932383?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Irakli Safareli</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=safareli" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/TheSpyder"><img src="https://avatars.githubusercontent.com/u/298292?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andrew Herron</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=TheSpyder" title="Documentation">📖</a> <a href="#plugin-TheSpyder" title="Plugin/utility libraries">🔌</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/EricCrosson"><img src="https://avatars.githubusercontent.com/u/1596818?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Eric Crosson</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=EricCrosson" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=EricCrosson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/burrscurr"><img src="https://avatars.githubusercontent.com/u/23213508?v=4?s=100" width="100px;" alt=""/><br /><sub><b>burrscurr</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=burrscurr" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.dijonkitchen.org/"><img src="https://avatars.githubusercontent.com/u/11434205?v=4?s=100" width="100px;" alt=""/><br /><sub><b>JC (Jonathan Chen)</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=dijonkitchen" title="Documentation">📖</a></td>
    <td align="center"><a href="http://fixate.it/"><img src="https://avatars.githubusercontent.com/u/1510520?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Larry Botha</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=larrybotha" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=larrybotha" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=larrybotha" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://epa.ms/RomanGusev"><img src="https://avatars.githubusercontent.com/u/5839225?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Roman Gusev</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=102" title="Documentation">📖</a></td>
    <td align="center"><a href="https://timwis.com/"><img src="https://avatars.githubusercontent.com/u/761444?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tim Wisniewski</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=timwis" title="Documentation">📖</a></td>
    <td align="center"><a href="https://world.hey.com/brais"><img src="https://avatars.githubusercontent.com/u/17855450?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brais Piñeiro</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=brapifra" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=brapifra" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/brds"><img src="https://avatars.githubusercontent.com/u/118620?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Renaud-Pierre Bordes</b></sub></a><br /><a href="#design-brds" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/fwip"><img src="https://avatars.githubusercontent.com/u/190414?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jemma Nelson</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=fwip" title="Documentation">📖</a></td>
    <td align="center"><a href="http://fullof.bs/"><img src="https://avatars.githubusercontent.com/u/77482?v=4?s=100" width="100px;" alt=""/><br /><sub><b>John Haugeland</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=StoneCypher" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/treydavis"><img src="https://avatars.githubusercontent.com/u/1691239?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Trey Davis</b></sub></a><br /><a href="#design-treydavis" title="Design">🎨</a></td>
    <td align="center"><a href="https://leonzalion.com/"><img src="https://avatars.githubusercontent.com/u/36966635?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Leon Si</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=leonzalion" title="Documentation">📖</a></td>
    <td align="center"><a href="http://spion.github.io/"><img src="https://avatars.githubusercontent.com/u/502412?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gorgi Kosev</b></sub></a><br /><a href="#infra-spion" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/mayconsacht"><img src="https://avatars.githubusercontent.com/u/5214042?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mayconsacht</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=mayconsacht" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/paldepind"><img src="https://avatars.githubusercontent.com/u/521604?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Simon Friis Vindum</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=paldepind" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=paldepind" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://twitter.com/gibson042"><img src="https://avatars.githubusercontent.com/u/1199584?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Richard Gibson</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=gibson042" title="Documentation">📖</a></td>
    <td align="center"><a href="https://alanharper.com.au/"><img src="https://avatars.githubusercontent.com/u/475?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alan Harper</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=aussiegeek" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Osman-Sodefa"><img src="https://avatars.githubusercontent.com/u/90332566?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Makien Osman</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=Osman-Sodefa" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sommd"><img src="https://avatars.githubusercontent.com/u/7817485?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Sommerich</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=sommd" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=sommd" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/diegopedro94"><img src="https://avatars.githubusercontent.com/u/7157796?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Diego Pedro</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=diegopedro94" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=diegopedro94" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/BoruiGu"><img src="https://avatars.githubusercontent.com/u/8686167?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Borui Gu</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=BoruiGu" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/eventualbuddha"><img src="https://avatars.githubusercontent.com/u/1938?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brian Donovan</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=eventualbuddha" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/volrk"><img src="https://avatars.githubusercontent.com/u/32265974?v=4?s=100" width="100px;" alt=""/><br /><sub><b>volrk</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=volrk" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=volrk" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=volrk" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/tinydylan"><img src="https://avatars.githubusercontent.com/u/41112113?v=4?s=100" width="100px;" alt=""/><br /><sub><b>tinydylan</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=tinydylan" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=tinydylan" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/jasikpark"><img src="https://avatars.githubusercontent.com/u/10626596?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Caleb Jasik</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=jasikpark" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/rulai-hu"><img src="https://avatars.githubusercontent.com/u/2570932?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rulai Hu</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=rulai-hu" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/afonsojramos"><img src="https://avatars.githubusercontent.com/u/19473034?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Afonso Jorge Ramos</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=afonsojramos" title="Documentation">📖</a></td>
    <td align="center"><a href="https://tjenkinson.me/"><img src="https://avatars.githubusercontent.com/u/3259993?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tom Jenkinson</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=tjenkinson" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/phormio"><img src="https://avatars.githubusercontent.com/u/28146332?v=4?s=100" width="100px;" alt=""/><br /><sub><b>phormio</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=phormio" title="Documentation">📖</a></td>
    <td align="center"><a href="http://buildo.io/"><img src="https://avatars.githubusercontent.com/u/2643520?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giovanni Gonzaga</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=giogonzo" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=giogonzo" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://caurea.org/"><img src="https://avatars.githubusercontent.com/u/34538?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tomas Carnecky</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=wereHamster" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Djaler"><img src="https://avatars.githubusercontent.com/u/7964583?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kirill Romanov</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=Djaler" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=Djaler" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=Djaler" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://giovannyg.github.io/"><img src="https://avatars.githubusercontent.com/u/5326411?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giovanny González</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=giovannyg" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/markkulube"><img src="https://avatars.githubusercontent.com/u/34955942?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mark Kulube</b></sub></a><br /><a href="#infra-markkulube" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="http://www.undiscoveredfeatures.com/"><img src="https://avatars.githubusercontent.com/u/354848?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Peter Hamilton</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=hamiltop" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ChineduOzodi"><img src="https://avatars.githubusercontent.com/u/11678369?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Chinedu Ozodi</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=ChineduOzodi" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/gunar"><img src="https://avatars.githubusercontent.com/u/7684574?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gunar Gessner</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=gunar" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/CSBatchelor"><img src="https://avatars.githubusercontent.com/u/18668440?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Christian Batchelor</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=CSBatchelor" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://tomeraberba.ch/"><img src="https://avatars.githubusercontent.com/u/23299544?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tomer Aberbach</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=TomerAberbach" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=TomerAberbach" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=TomerAberbach" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/0xflotus"><img src="https://avatars.githubusercontent.com/u/26602940?v=4?s=100" width="100px;" alt=""/><br /><sub><b>0xflotus</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=0xflotus" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/CodeLenny"><img src="https://avatars.githubusercontent.com/u/9272847?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ryan Leonard</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=CodeLenny" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=CodeLenny" title="Documentation">📖</a> <a href="https://github.com/dubzzz/fast-check/commits?author=CodeLenny" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://blog.bitjson.com/"><img src="https://avatars.githubusercontent.com/u/904007?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jason Dreyzehner</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=bitjson" title="Code">💻</a> <a href="https://github.com/dubzzz/fast-check/commits?author=bitjson" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://matinzd.dev/"><img src="https://avatars.githubusercontent.com/u/24797481?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matin Zadeh Dolatabad</b></sub></a><br /><a href="https://github.com/dubzzz/fast-check/commits?author=matinzd" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome! [Become one of them](CONTRIBUTING.md)

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
