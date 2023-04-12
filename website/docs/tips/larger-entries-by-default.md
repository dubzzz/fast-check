---
slug: /tips/larger-entries-by-default
---

# Larger entries by default

Customize the default "good enough" size for your tests.

## Introduction

Have you ever thought about what is a good random string? What we usually call strings range from a few characters to thousands or even more characters. When using fast-check to generate random strings, arrays, objects, etc., the question of what constitutes a good length has to be addressed.

There were multiple ways to handle that case:

- Explicit: Require users to specify the maximum length whenever a structure with length is generated.
- Implicit: Never require users to specify the maximum length and instead fallback to a default maximum length when none is provided.
- A combination of the two...

However, the requested maximum length may not be a true constraint of the algorithm itself, but rather a suitable length for testing. By asking users to specify this maximum length, we are somehow asking them to configure an internal aspect of the framework.

To overcome this limitation, we introduced the concept of "size", which is not directly tied to the maximum length. While the maximum length serves as an upper boundary for the algorithm, the size parameter represents an upper boundary for testing purposes.

## Size explained

Since version 2.22.0, there is a distinction between constraints required by specifications and what will really be generated. When dealing with array-like arbitraries such as `fc.array` or `fc.string`, defining a constraint like `maxLength` can be seen as if you wrote "my algorithm is not supposed to handle arrays having more than X elements". It does not ask fast-check to generate arrays with X elements, but tells it that it could if needed or asked to.

What really drives fast-check into generating large arrays is called `size`. At the level of an arbitrary it can be set to:

- Relative size: `"-4"`, `"-3"`, `"-2"`, `"-1"`, `"="`, `"+1"`, `"+2"`, `"+3"` or `"+4"` — _offset the global setting `baseSize` by the passed offset_
- Explicit size: `"xsmall"`, `"small"`, `"medium"`, `"large"` or `"xlarge"` — _use an explicit size_
- Exact value: `"max"` — _generate entities having up-to `maxLength` items_
- Automatic size: `undefined` — _if `maxLength` has not been specified or if the global setting `defaultSizeToMaxWhenMaxSpecified` is `false` then `"="`, otherwise `"max"`_

Here is a quick overview of how we use the `size` parameter associated to a minimal length to compute the maximal length for the generated values:

- `xsmall` — `min + (0.1 * min + 1)`
- `small` (default) — `min + (1 * min + 10)`
- `medium` — `min + (10 * min + 100)`
- `large` — `min + (100 * min + 1000)`
- `xlarge` — `min + (1000 * min + 10000)`

## Depth size explained

Since version 2.25.0, there is a tied link between [size](/docs/tips/larger-entries-by-default#size-explained) and depth of recursive structures.

`depthFactor` (aka `depthSize` since 3.0.0) has been introduced in version 2.14.0 as a numeric floating point value between `0`
and `+infinity`. It was used to reduce the risk of generating infinite structures when relying on recursive arbitraries.

Then size came in 2.22.0 and with it an idea: make it simple for users to configure complex things. While depth factor
was pretty cool, selecting the right value was not trivial from a user point of view. So size has been leveraged for both:
number of items defined within an iterable structure and depth. Except very complex and ad-hoc cases, we expect size to
be the only kind of configuration used to setup depth factors.

So starting in 3.0.0, we relabelled `depthFactor` as `depthSize`. It works exactly the same way as size, it can rely on Relative Size but also Explicit Size. As for length, if not specified the size will either be defaulted to `"="` or to `"max"` depending on the flag `defaultSizeToMaxWhenMaxSpecified` and on the fact that the user specified a maximal depth or not. The only case defaulting to `"max"` is: user specified a maximal depth onto the instance but not size and `defaultSizeToMaxWhenMaxSpecified` is set to `true`. Any other setup will fallback to `"="`.

Here is how a size translates into manually defined `depthSize`:

- `xsmall` — `1`
- `small` (default) — `2`
- `medium` — `4`
- `large` — `8`
- `xlarge` — `16`

In the context of fast-check@v2, the condition to leverage an automatic defaulting of the depth factor is to:

- either define it to `=` for each arbitrary not defaulting it automatically (only `option` and `oneof` do not default it to avoid breaking existing code)
- or to configure a `baseSize` in the global settings

In the context of fast-check@v2, `depthFactor` is the same as `depthSize` except for numeric values. For those values `depthSize = 1 / depthFactor`.

If none of these conditions is fulfilled the depth factor will be defaulted to `0` as it was the case before we introduced it.
Otherwise, depth factor will be defaulted automatically for you.

## Override the default size

By default, all arbitraries have their size set to `baseSize`, which is set to `"small"` by default. This means that when generating array-like entities, the number of items in them will be relatively small. Specifically, when using `fc.array(fc.nat())`, the resulting arrays will have between 0 and 10 elements.

There are two main ways to adjust this upper bound:

- At instantiation level by passing an explicit size, as in `fc.array(fc.nat(), {size: '+1'})`
- At global level

At global level, there are two main options:

- `baseSize`, which defaults to `"small"`, sets the default size when no size is specified at the instantiation level.
- `defaultSizeToMaxWhenMaxSpecified` determines how to handle cases where an arbitrary has an upper bound (e.g., `maxLength` or `maxDepth`) but no size is specified. When `true`, the size defaults to the maximum value; when `false`, the size defaults to `baseSize` if not defined.

Here's a brief example that demonstrates how to customize both the global and instantiation levels:

```js
// Override the global size to medium.
fc.configureGlobal({ baseSize: 'medium' });

// Override the local size of the second string only.
// Size 'medium' will be used by a and c, while b will be 'large' (=medium+1).
test('should always contain its substrings', () => {
  fc.assert(
    fc.property(fc.string(), fc.string({ size: '+1' }), fc.string(), (a, b, c) => {
      expect(contains(a + b + c, b)).toBe(true);
    })
  );
});
```

:::info
To learn how to customize the size for a particular arbitrary, please refer to the [documentation](/docs/category/arbitraries) provided for that arbitrary.
:::
