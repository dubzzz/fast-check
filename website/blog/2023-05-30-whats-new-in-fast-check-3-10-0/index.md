---
title: What's new in fast-check 3.10.0?
authors: [dubzzz]
tags: [release, stringMatching, regex, strings]
---

This release comes with a new arbitrary called `stringMatching`. This arbitrary is responsible to generate strings matching the provided regex. It should ease the creation of new arbitraries dealing with strings by providing an easy way to build them.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## String from regex

The arbitrary `stringMatching` has been introduced in response to users requesting for a simpler way to create string values. Previously, users had to combine multiple arbitraries to create their own custom string values. While powerful, it was less beginner-friendly.

For example, in the past, if users wanted to build their own IP v4 generators, they would have needed to write the following code:

```js
const ipV4Arbitrary = fc
  .tuple(fc.nat({ max: 255 }), fc.nat({ max: 255 }), fc.nat({ max: 255 }), fc.nat({ max: 255 }))
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);
```

With our new helper, constructing string values can be as _simple_ as writing a regular expression:

```js
const ipV4Arbitrary = fc.stringMatching(
  /^(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\.(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\.(?:\d|[1-9]\d|1\d\d|2[0-5]\d)\.(?:\d|[1-9]\d|1\d\d|2[0-5]\d)$/,
);
```

By leveraging the `stringMatching`, users can now easily define string patterns that conform to specific rules or formats. It should reduce the learning curve associated with custom string value generation.

:::info Don't forget `^` or `$`
By default, the `stringMatching` arbitrary generates strings that match the provided regular expression. It's important to note that if you don't include the `^` (start of string) or `$` (end of string) assertions in your regex, the generated string may contain more characters than expected.

In the example above, we explicitly included the `^` and `$` assertions in our regex to ensure that the generated values strictly restrict to an IP v4. Without these assertions, the arbitrary could have produced strings like `a(g{{jzerj1.90.1.1dfiosr`. Therefore, when using `stringMatching`, remember to include `^` at the beginning and `$` at the end of your regex if you want to avoid generating values that start with unrelated characters.
:::

:::warning Partial support
Please note that while JavaScript regular expressions allow for the definition of complex constraints on strings, our current implementation in fast-check has some limitations in handling certain regex features. Specifically, the following constructs are not supported: `\b`, `\B`, `(?=`, `(?!`, `(?<=`, `(?<!`…
:::

More details on this arbitrary at [Arbitraries / Combiners / String](/docs/core-blocks/arbitraries/combiners/string/#stringmatching).

## Changelog since 3.9.0

The version 3.10.0 is based on version 3.9.0.

### Features

- ([PR#3920](https://github.com/dubzzz/fast-check/pull/3920)) Prepare tokenizers for `stringMatching`
- ([PR#3921](https://github.com/dubzzz/fast-check/pull/3921)) Introduce `stringMatching`
- ([PR#3924](https://github.com/dubzzz/fast-check/pull/3924)) Add support for negate regex
- ([PR#3925](https://github.com/dubzzz/fast-check/pull/3925)) Explicit ban of unsupported regex flags in `stringMatching`
- ([PR#3926](https://github.com/dubzzz/fast-check/pull/3926)) Add support for capturing regexes
- ([PR#3927](https://github.com/dubzzz/fast-check/pull/3927)) Add support for disjunctions in regexes
- ([PR#3928](https://github.com/dubzzz/fast-check/pull/3928)) Correctly parse ^ and $ in regex
- ([PR#3929](https://github.com/dubzzz/fast-check/pull/3929)) Correctly parse numeric backreference
- ([PR#3930](https://github.com/dubzzz/fast-check/pull/3930)) Correctly parse look\{ahead,behind\} in regexes
- ([PR#3932](https://github.com/dubzzz/fast-check/pull/3932)) Support empty disjunctions in regexes
- ([PR#3933](https://github.com/dubzzz/fast-check/pull/3933)) Add parsing support for \p and \k
- ([PR#3935](https://github.com/dubzzz/fast-check/pull/3935)) Support generation of strings not constrained by ^ or $
- ([PR#3938](https://github.com/dubzzz/fast-check/pull/3938)) Support regex flags: d, m and s
- ([PR#3939](https://github.com/dubzzz/fast-check/pull/3939)) Support unicode regexes

### Fixes

- ([PR#3909](https://github.com/dubzzz/fast-check/pull/3909)) Clean: Drop bundle centric tests
- ([PR#3902](https://github.com/dubzzz/fast-check/pull/3902)) Doc: Release note page for 3.9.0
- ([PR#3904](https://github.com/dubzzz/fast-check/pull/3904)) Doc: Fix typo in What's new 3.9.0
- ([PR#3910](https://github.com/dubzzz/fast-check/pull/3910)) Doc: Lazy load image of sponsors
- ([PR#3911](https://github.com/dubzzz/fast-check/pull/3911)) Doc: Add alt labels on feature badges
- ([PR#3912](https://github.com/dubzzz/fast-check/pull/3912)) Doc: Stop lazy images in critical viewport
- ([PR#3913](https://github.com/dubzzz/fast-check/pull/3913)) Doc: Better a11y on feature badges
- ([PR#3898](https://github.com/dubzzz/fast-check/pull/3898)) Script: Run publint in strict mode
- ([PR#3903](https://github.com/dubzzz/fast-check/pull/3903)) Test: Rework race conditions specs in tutorial
- ([PR#3931](https://github.com/dubzzz/fast-check/pull/3931)) Test: Add some more checks on `stringMatching`
- ([PR#3936](https://github.com/dubzzz/fast-check/pull/3936)) Test: Test against more regexes in `stringMatching`
- ([PR#3940](https://github.com/dubzzz/fast-check/pull/3940)) Test: Add some more known regexes in our test suite
