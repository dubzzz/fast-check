---
sidebar_position: 3
slug: /introduction/track-record/
---

# Track Record

Some examples of key projects with bugs detected by fast-check

## Summary

There is no doubt about the efficiency of bug-detection capabilities provided by fast-check when it comes to critical open-source projects. It has successfully identified bugs in key projects within the JavaScript ecosystem, including utility libraries like [underscore.js](https://underscorejs.org/) and test runners such as [jest](https://jestjs.io/) and [jasmine](https://jasmine.github.io/).

Here is a non-exhaustive list of issues linked to identified and confirmed bugs opened thanks to fast-check: [adobe/react-spectrum#2065](https://github.com/adobe/react-spectrum/issues/2065), [devongovett/regexgen#33](https://github.com/devongovett/regexgen/issues/33), [facebook/react#18661](https://github.com/facebook/react/issues/18661), [gcanti/io-ts#214](https://github.com/gcanti/io-ts/issues/214), [HdrHistogram/HdrHistogramJS#9](https://github.com/HdrHistogram/HdrHistogramJS/issues/9), [jashkenas/underscore#2815](https://github.com/jashkenas/underscore/pull/2815), [jasmine/jasmine#1764](https://github.com/jasmine/jasmine/pull/1764), [jestjs/jest#7937](https://github.com/jestjs/jest/issues/7937), [jestjs/jest#7941](https://github.com/jestjs/jest/issues/7941), [jestjs/jest#7975](https://github.com/jestjs/jest/issues/7975), [jestjs/jest#8403](https://github.com/jestjs/jest/issues/8403), [jestjs/jest#11055](https://github.com/jestjs/jest/issues/11055), [jestjs/jest#11056](https://github.com/jestjs/jest/issues/11056), [jezen/is-thirteen#558](https://github.com/jezen/is-thirteen/issues/558), [left-pad/left-pad#58](https://github.com/left-pad/left-pad/issues/58), [manishsaraan/email-validator#40](https://github.com/manishsaraan/email-validator/pull/40), [numpy/numpy#15394](https://github.com/numpy/numpy/issues/15394), [streamich/react-use#788](https://github.com/streamich/react-use/pull/788), [trekhleb/javascript-algorithms#102](https://github.com/trekhleb/javascript-algorithms/issues/102), [trekhleb/javascript-algorithms#129](https://github.com/trekhleb/javascript-algorithms/issues/129), [trekhleb/javascript-algorithms#305](https://github.com/trekhleb/javascript-algorithms/issues/305), [trekhleb/javascript-algorithms#306](https://github.com/trekhleb/javascript-algorithms/issues/306), [trekhleb/javascript-algorithms#307](https://github.com/trekhleb/javascript-algorithms/issues/307), [trekhleb/javascript-algorithms#308](https://github.com/trekhleb/javascript-algorithms/issues/308)…

It also found back most of the CVEs related to prototype poisoning reported on [lodash](https://lodash.com/).

## Detailed examples

### `trekhleb/javascript-algorithms`

![GitHub stars](https://img.shields.io/github/stars/trekhleb/javascript-algorithms?style=flat)

**Issue detected:** counting sort algorithm was really badly handling negative integer values \[[more](https://github.com/trekhleb/javascript-algorithms/pull/100)\]

**Code example:** `sort([-1])` produces `[null]`

**Issue detected:** knutt morris pratt implementation considered `""` was not a substring of `""` \[[more](https://github.com/trekhleb/javascript-algorithms/pull/101)\]

**Code example:**

```js
knuthMorrisPratt('', ''); //=> -1
knuthMorrisPratt('a', 'a'); //=> 0
```

**Issue detected:** integer overflows and rounding issues in the implementation of rabin karp \[[more](https://github.com/trekhleb/javascript-algorithms/pull/102)\]\[[+](https://github.com/trekhleb/javascript-algorithms/pull/110)\]

**Code example:**

```js
rabinKarp("^ !/'#'pp", " !/'#'pp") //=> -1
// expected to be 2

rabinKarp("a\u{10000}", "\u{10000}") //=> -1
// After 1st fix: issues with unicode characters outside BMP plan
rabinKarp("a耀a","耀a"))                //=> 1
rabinKarp("\u0000耀\u0000","耀\u0000")) //=> -1
// After 2nd fix
```

**Issue detected:** longest common substring algorithm not properly handling unicode characters outside BMP plan \[[more](https://github.com/trekhleb/javascript-algorithms/pull/129)\]

**Code example:**

```js
longestCommonSubstr('𐌵𐌵**ABC', '𐌵𐌵--ABC'); //=> "𐌵𐌵"
// expected to be "ABC"
```

### `jestjs/jest`

![GitHub stars](https://img.shields.io/github/stars/jestjs/jest?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/jest)

**Issue detected:** `toStrictEqual` fails to distinguish 0 from 5e-324 \[[more](https://github.com/jestjs/jest/issues/7941)\]

**Code example:** `expect(0).toStrictEqual(5e-324)` succeeds

**Issue detected:** `toEqual` not symmetric for Set \[[more](https://github.com/jestjs/jest/issues/7975)\]

**Code example:**

```js
const s1 = new Set([false, true]);
const s2 = new Set([new Boolean(true), new Boolean(true)]);

expect(s1).not.toEqual(s2); // success
expect(s2).not.toEqual(s1); // failure
```

### `nodeca/js-yaml`

![GitHub stars](https://img.shields.io/github/stars/nodeca/js-yaml?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/js-yaml)

**Issue detected:** enabling `!!int: binary` style when dumping negative integers produces invalid content \[[more](https://github.com/nodeca/js-yaml/pull/398)\]

**Code example:** `yaml.dump({toto: -10}, {styles:{'!!int':'binary'}})` produces `toto: 0b-1010` not `toto: -0b1010`

### `sindresorhus/query-string`

![GitHub stars](https://img.shields.io/github/stars/sindresorhus/query-string?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/query-string)

**Issue detected:** enabling the `bracket` setting when exporting arrays containing null values produces an invalid output for the parser \[[more](https://github.com/sindresorhus/query-string/pull/138)\]

**Code example:**

```js
m.stringify({ bar: ['a', null, 'b'] }, { arrayFormat: 'bracket' }); //=> "bar[]=a&bar&bar[]=b"
m.parse('bar[]=a&bar&bar[]=b', { arrayFormat: 'bracket' }); //=> {bar: [null, 'b']}
```

### `stevemao/left-pad`

![GitHub stars](https://img.shields.io/github/stars/stevemao/left-pad?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/left-pad)

**Issue detected:** unicode characters outside of the BMP plan are not handled consistently \[[more](https://github.com/stevemao/left-pad/issues/58)\]

**Code example:**

```js
leftPad('a\u{1f431}b', 4, 'x'); //=> 'a\u{1f431}b'  -- in: 3 code points, out: 3 code points
leftPad('abc', 4, '\u{1f431}'); //=> '\u{1f431}abc' -- in: 3 code points, out: 4 code points
```

### `eemeli/yaml`

![GitHub stars](https://img.shields.io/github/stars/eemeli/yaml?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/yaml)

**Issue detected:** unability to parse string values starting by `:,` \[[more](https://github.com/eemeli/yaml/issues/56)\]

**Code example:**

```js
YAML.stringify([[':,']]); //=> '- - :,\n'
YAML.parse('- - :,\n'); //=> YAMLSyntaxError: Document is not valid YAML (bad indentation?)
```

**Issue detected:** some extra spaces added or removed during the parsing \[[more](https://github.com/eemeli/yaml/issues/57)\]

**Code example:**

```js
YAML.parse(YAML.stringify([{ k: `!""""""""""""""""""""""""""""""""""#"\\ '` }]));
//=> [{k: `!""""""""""""""""""""""""""""""""""#"\\'`}]
```

### `blakeembrey/javascript-stringify`

![GitHub stars](https://img.shields.io/github/stars/blakeembrey/javascript-stringify?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/javascript-stringify)

**Issue detected:** `-0` was not stringified correctly \[[more](https://github.com/blakeembrey/javascript-stringify/pull/20)\]

**Code example:** `stringify(-0)` produces `"0"` instead of `"-0"`

### `auth0/node-jsonwebtoken`

![GitHub stars](https://img.shields.io/github/stars/auth0/node-jsonwebtoken?style=flat)
![monthly downloads](https://img.shields.io/npm/dm/jsonwebtoken)

**Issue detected:** signing an object with specific keys (`toString`, `valueOf`, `hasOwnProperty`, `__proto__`...) crashes with an error \[[more](https://github.com/auth0/node-jsonwebtoken/issues/945)\]

**Code example:**

```js
jwt.sign({ valueOf: 0 }, 'some-key');
//=> throws TypeError `validator.isValid is not a function`
```
