# 0.0.13

_Readme update_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.13)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.12...v0.0.13)]

## Fixes

- ([79fadb2](https://github.com/dubzzz/fast-check/commit/79fadb2)) Update README.md

# 0.0.12

_New arbitraries: constantFrom and record_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.12)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.11...v0.0.12)]

## Features:

- ([786e16e](https://github.com/dubzzz/fast-check/commit/786e16e)) Modify default values available for fc.object
- ([8984e78](https://github.com/dubzzz/fast-check/commit/8984e78)) Add flag to generate fc.record with missing keys
- ([850158b](https://github.com/dubzzz/fast-check/commit/850158b)) Add fc.record Arbitrary
- ([262b809](https://github.com/dubzzz/fast-check/commit/262b809)) Add fc.constantFrom Arbitrary

## Fixes:

- ([6db53f2](https://github.com/dubzzz/fast-check/commit/6db53f2)) Clean: Exclude example/ from npm package
- ([036cd2f](https://github.com/dubzzz/fast-check/commit/036cd2f)) Doc: Documentation noShrink
- ([0ee3a03](https://github.com/dubzzz/fast-check/commit/0ee3a03)) Doc: Link towards jsDelivr

# 0.0.11

_Bundled for web-browsers and node_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.11)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.10...v0.0.11)]

## Features:
- Add bundle for web-browsers
- Add code examples in the source code
- Add minimal length parameter on all strings arbitraries
- Add es3 support in order to support oldest versions of node
- Add `set`, `char16bits` and `fullUnicode` arbitraries
- Add timeout parameter on asychronous properties

## Fixes:
- Fix: unicode character generators

# 0.0.10

_Fix shrink of async properties_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.10)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.9...v0.0.10)]

## Fixes:

- Fix: bug in shrink of async properties

# 0.0.9

_JSON arbitraries and shrinker kill switch_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.9)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.8...v0.0.9)]

## Features:

- `noShrink` method can remove shrink from existing arbitraries
- Add `jsonObject` and `unicodeJsonObject` arbitraries
- Support higher number of arbitraies in tuples and properties

# 0.0.8

_Code and documentation alignment_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.8)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.7...v0.0.8)]

## Fixes:

- Doc: align documentation with code
- Doc: missing parts in the documentation

# 0.0.7

_Going async/await_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.7)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.6...v0.0.7)]

## Features:

- Support async/await properties
- Add `frequency`, `anything`, `object`, `json`, `dictionary` arbitraries
- Accept min and max length on `array`

## Fixes:

- Clean: Better integration with modern tests frameworks (throw Error not strings)

# 0.0.6

_Force ready to be used version_
[[Code](https://github.com/dubzzz/fast-check/tree/v0.0.6)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.5...v0.0.6)]

## Features:

- Add `option`, `float`, `double`, `boolean` arbitraries
- Add function to extract generated values `fc.sample` and `fc.statitistics`

## Fixes:

- Doc: creation of a documentation
