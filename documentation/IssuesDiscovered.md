# [:house:](../README.md) Issues discovered using fast-check

## [trekhleb/javascript-algorithms](https://github.com/trekhleb/javascript-algorithms/)

**Statistics:** ~40000⭐ - *Jan 2019*

**Issue detected:** counting sort algorithm was really badly handling negative integer values \[[more](https://github.com/trekhleb/javascript-algorithms/pull/100)\]

**Code example:** `sort([-1])` produces `[null]`

**Issue detected:** knutt morris pratt implementation considered `""` was not a substring of `""` \[[more](https://github.com/trekhleb/javascript-algorithms/pull/101)\]

**Code example:**

```js
knuthMorrisPratt("", "")   //=> -1
knuthMorrisPratt("a", "a") //=> 0
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
longestCommonSubstr('𐌵𐌵**ABC', '𐌵𐌵--ABC') //=> "𐌵𐌵"
// expected to be "ABC"
```

## [facebook/jest](https://github.com/facebook/jest/)

**Statistics:** ~25000⭐ ~4m/wk downloads📈 - *May 2019*

**Issue detected:** `toStrictEqual` fails to distinguish 0 from 5e-324 \[[more](https://github.com/facebook/jest/issues/7941)\]

**Code example:** `expect(0).toStrictEqual(5e-324)` succeeds

**Issue detected:** `toEqual` not symmetric for Set \[[more](https://github.com/facebook/jest/issues/7975)\]

**Code example:**
```js
const s1 = new Set([false, true]);
const s2 = new Set([new Boolean(true), new Boolean(true)]);

expect(s1).not.toEqual(s2); // success
expect(s2).not.toEqual(s1); // failure
```

## [nodeca/js-yaml](https://github.com/nodeca/js-yaml/)

**Statistics:** ~3000⭐ ~13m/wk downloads📈 - *Jan 2019*

**Issue detected:** enabling `!!int: binary` style when dumping negative integers produces invalid content \[[more](https://github.com/nodeca/js-yaml/pull/398)\]

**Code example:** `yaml.dump({toto: -10}, {styles:{'!!int':'binary'}})` produces `toto: 0b-1010` not `toto: -0b1010`

## [sindresorhus/query-string](https://github.com/sindresorhus/query-string)

**Statistics:** ~3000⭐ ~5m/wk downloads📈 - *Jan 2019*

**Issue detected:** enabling the `bracket` setting when exporting arrays containing null values produces an invalid output for the parser \[[more](https://github.com/sindresorhus/query-string/pull/138)\]

**Code example:**
```js
m.stringify({bar: ['a', null, 'b']}, {arrayFormat: 'bracket'}) //=> "bar[]=a&bar&bar[]=b"
m.parse('bar[]=a&bar&bar[]=b', {arrayFormat: 'bracket'})       //=> {bar: [null, 'b']}
```

## [stevemao/left-pad](https://github.com/stevemao/left-pad)

**Statistics:** ~1000⭐ ~2m/wk downloads📈 - *Jan 2019*

**Issue detected:** unicode characters outside of the BMP plan are not handled consistently \[[more](https://github.com/stevemao/left-pad/issues/58)\]

**Code example:**
```js
leftPad('a\u{1f431}b', 4, 'x') //=> 'a\u{1f431}b'  -- in: 3 code points, out: 3 code points
leftPad('abc', 4, '\u{1f431}') //=> '\u{1f431}abc' -- in: 3 code points, out: 4 code points
```

## [eemeli/yaml](https://github.com/eemeli/yaml)

**Statistics:** ~100⭐ ~60k/wk downloads📈 - *Jan 2019*

**Issue detected:** unability to parse string values starting by `:,` \[[more](https://github.com/eemeli/yaml/issues/56)\]

**Code example:**
```js
YAML.stringify([[':,']]) //=> '- - :,\n'
YAML.parse('- - :,\n')   //=> YAMLSyntaxError: Document is not valid YAML (bad indentation?)
```

**Issue detected:** some extra spaces added or removed during the parsing \[[more](https://github.com/eemeli/yaml/issues/57)\]

**Code example:**
```js
YAML.parse(YAML.stringify([{k: `!""""""""""""""""""""""""""""""""""#"\\ '`}]))
//=> [{k: `!""""""""""""""""""""""""""""""""""#"\\'`}]
```

## [blakeembrey/javascript-stringify](https://github.com/blakeembrey/javascript-stringify/)

**Statistics:** ~50⭐ ~250k/wk downloads📈 - *Feb 2019*

**Issue detected:** `-0` was not stringified correctly \[[more](https://github.com/blakeembrey/javascript-stringify/pull/20)\]

**Code example:** `stringify(-0)` produces `"0"` instead of `"-0"`
