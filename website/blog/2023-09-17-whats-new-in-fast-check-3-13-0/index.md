---
title: What's new in fast-check 3.13.0?
authors: [dubzzz]
tags: [what's new, performance, arbitrary]
---

This release introduces performance optimizations for `float`, `double` and `ulid`, along with the ability to define ranges with excluded boundaries for `float` and `double`.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Performance optimizations

:::info Benchmarks
When it comes to optimizing JavaScript code, developers have a variety of tricks to choose from. These range from minimizing the number of operations to adopting memory-efficient algorithms and utilizing caches. However, achieving the best performance often involves navigating trade-offs, considering factors such as garbage collection costs, V8 optimization of monomorphic operations, and V8's internal representation of certain data types.

To determine the most effective option, we conducted benchmarks using [tinybench](https://github.com/tinylibs/tinybench). All the following figures are based on measurements from running tinybench with 100k iterations on GitHub Actions workers.
:::

### Faster decomposition of floating point values

When creating arbitraries for `float` and `double`, fast-check relies on an algorithm able to compute the position of any floating-point number within the entire range of existing values. For instance, the value 2<sup>-52</sup> is the 629,145,600<sup>th</sup> 32-bits float and the 1,018,167,296<sup>th</sup> 64-bits float.

This numbering system enables the enumeration of all possible floating-point numbers. For instance, immediately following 1, the value is 1.0000001192092896 for 32-bit floats and 1.0000009536743164 for 64-bit floats.

The algorithm responsible for finding the index of any floating-point number relies on a code snippet capable of decomposing a float into its significand and exponent. Initially, our implementation involved a loop to accomplish this task.

```ts
export function decomposeFloat(f: number): { exponent: number; significand: number } {
  // 1 => significand 0b1   - exponent 1 (will be preferred)
  //   => significand 0b0.1 - exponent 2
  const maxSignificand = 1 + (2 ** 23 - 1) / 2 ** 23;
  for (let exponent = -126; exponent !== 128; ++exponent) {
    const powExponent = 2 ** exponent;
    const maxForExponent = maxSignificand * powExponent;
    if (Math.abs(f) <= maxForExponent) {
      return { exponent, significand: f / powExponent };
    }
  }
  return { exponent: Number.NaN, significand: Number.NaN };
}
```

This implementation relied on iterating over up to 253 values to extract significand and exponent to later find the index of a floating-point number. However, this approach proved to be inefficient. Thanks to the contributions of [@zbjornson](https://github.com/zbjornson), an optimized version has been introduced in the latest release (see [#4059](https://github.com/dubzzz/fast-check/pull/4059)).

```ts
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer, f32.byteOffset);

function bitCastFloatToUInt32(f: number): number {
  f32[0] = f;
  return u32[0];
}

export function decomposeFloat(f: number): { exponent: number; significand: number } {
  const bits = bitCastFloatToUInt32(f);
  const signBit = bits >>> 31;
  const exponentBits = (bits >>> 23) & 0xff;
  const significandBits = bits & 0x7fffff;

  const exponent = exponentBits === 0 ? -126 : exponentBits - 127;
  let significand = exponentBits === 0 ? 0 : 1;
  significand += significandBits / 2 ** 23;
  significand *= signBit === 0 ? 1 : -1;

  return { exponent, significand };
}
```

This optimization will speed-up the instantiation of any instance of `float` or `double` or any arbitrary derived from them.

### Higher throughput thanks to less allocations

The initial implementation of `ulid` in fast-check encountered several performance issues. However, in version 3.12.0, significant improvements have been made, resulting in a twofold increase in performance. In version 3.11.0, the code below performed at 1,774 ops/sec (±0.06%), but after all the optimizations, it now runs at 3,447 ops/sec (±0.10%):

```ts
fc.assert(fc.property(fc.ulid(), (_unused) => true));
```

The first set of optimizations primarily focused on reducing the number of allocations, aiming for a more memory-efficient solution. These optimizations were mainly addressed in [#4088](https://github.com/dubzzz/fast-check/pull/4088) and [#4091](https://github.com/dubzzz/fast-check/pull/4091).

One of the optimizations involved transforming our internal `pad` function to avoid unnecessary array allocations during filling and joining. The original implementation looked like this:

```ts
function pad(value: string, constLength: number) {
  return (
    Array(constLength - value.length)
      .fill('0')
      .join('') + value
  );
}
```

To achieve a more efficient version, we transformed it as follows:

```ts
function pad(value: string, constLength: number) {
  let extraPadding = '';
  while (value.length + extraPadding.length < constLength) {
    extraPadding += '0';
  }
  return extraPadding + value;
}
```

With this optimization, the execution time of the function `pad` has been reduced by a factor of 2. The performance improvements can be observed in the following results: `pad('', 10)` improved from 1,411,410 ops/sec (±2.31%) to 2,385,090 ops/sec (±14.86%), `pad('01234', 10)` increased from 1,627,234 ops/s (±11.54%) to 3,817,072 ops/sec (±4.11%) and `pad('0123456789', 10)` saw a rise from 3,895,766 ops/sec (±2.72%) to 4,848,174 ops/sec (±3.15%).

Similar improvements were made in other parts of the code, such as replacing array joins with simple concatenations, replacing the code below:

```ts
return [compute(a), compute(b), compute(c)].join('');
```

By a more efficient version of it:

```ts
return compute(a) + compute(b) + compute(c);
```

This optimization led to significantly faster execution times, approaching a factor of 2 speed-up with: 2,507,281 ops/sec (±17.68%) for `[compute('a'), compute('b'), compute('c')].join('')` compared to 4,884,371 ops/sec (±0.56%) for `compute('a') + compute('b') + compute('c')`.

Not only we addressed memory footprint, but also performed algorithmic optimizations. The code below was responsible for both excessive memory allocations and redundant recomputation of powers of 32:

```ts
const symbols = normalizedBase32str.split('').map((char) => decodeSymbolLookupTable[char]);
return symbols.reduce((prev, curr, i) => prev + curr * Math.pow(32, symbols.length - 1 - i), 0);
```

We first started to drop the unwanted memory allocations and moved from 677,844 ops/sec (±4.28%) to 809,730 ops/sec (±0.94%) with simple for-loop based version:

```ts
let sum = 0;
for (let index = 0; index !== normalizedBase32str.length; ++index) {
  const char = normalizedBase32str[index];
  const symbol = decodeSymbolLookupTable[char];
  sum += symbol * Math.pow(32, normalizedBase32str.length - 1 - i);
}
return sum;
```

We continued by addressing the power of 32 part:

```ts
let sum = 0;
for (let index = 0, base = 1; index !== normalizedBase32str.length; ++index, base *= 32) {
  const char = normalizedBase32str[normalizedBase32str.length - index - 1];
  const symbol = decodeSymbolLookupTable[char];
  sum += symbol * base;
}
return sum;
```

With this last optimization, the throughput reached an 2,198,923 ops/sec (±1.46%).

For further details on these and other optimizations, you can refer to the pull requests: [#4088](https://github.com/dubzzz/fast-check/pull/4088), [#4091](https://github.com/dubzzz/fast-check/pull/4091),[#4092](https://github.com/dubzzz/fast-check/pull/4092) and [#4098](https://github.com/dubzzz/fast-check/pull/4098). Some of these PRs also address low-level issues by keeping produced values within the int32 range, leveraging slight performance optimizations of V8 on integer values.

## Excluded min and max

Until now, when utilizing arbitraries for `float` and `double`, the `min` and `max` values were always included in the set of generated values. This means that requesting `double({min: 0, max: 1})` would produce values such that `0 ≤ value ≤ 1`. If you wanted to exclude the value 1 from the range, you had to manually specify a max value slightly below 1.

With version 3.12.0, fast-check now offers two new options

- `minExcluded`: This option excludes the minimum value from the set of generated values.
- `maxExcluded`: This option excludes the maximum value from the set of generated values.

For example, if you want to exclude the value 1 from the range, you can now write: `double({min: 0, max: 1, maxExcluded: true})`, and this will produce values where `0 ≤ value < 1`, effectively excluding the value 1 from the generated set.

## Changelog since 3.12.0

The version 3.13.0 is based on version 3.12.1.

### Features

- ([PR#4197](https://github.com/dubzzz/fast-check/pull/4197)) Add support for "Invalid Date" in `date`
- ([PR#4203](https://github.com/dubzzz/fast-check/pull/4203)) Deprecate `withDeletedKeys` on `record`
- ([PR#4204](https://github.com/dubzzz/fast-check/pull/4204)) Support null-proto in `dictionary`
- ([PR#4205](https://github.com/dubzzz/fast-check/pull/4205)) Support null-proto in `record`

### Fixes

- ([PR#4172](https://github.com/dubzzz/fast-check/pull/4172)) Bug: Better declare ESM's types
- ([PR#4177](https://github.com/dubzzz/fast-check/pull/4177)) Bug: Replace macros in published esm types
- ([PR#4207](https://github.com/dubzzz/fast-check/pull/4207)) Bug: Better poisoning resiliency for `dictionary`
- ([PR#4156](https://github.com/dubzzz/fast-check/pull/4156)) CI: Stop formatting built website
- ([PR#4155](https://github.com/dubzzz/fast-check/pull/4155)) CI: Add TypeScript checks on website
- ([PR#4171](https://github.com/dubzzz/fast-check/pull/4171)) CI: Update Devcontainer settings
- ([PR#4181](https://github.com/dubzzz/fast-check/pull/4181)) CI: Add exempted labels for stale bot
- ([PR#4194](https://github.com/dubzzz/fast-check/pull/4194)) CI: Add some more details onto the PWA
- ([PR#4211](https://github.com/dubzzz/fast-check/pull/4211)) CI: Rework broken test on `date`
- ([PR#4212](https://github.com/dubzzz/fast-check/pull/4212)) CI: Rework broken test on `date` (retry)
- ([PR#4214](https://github.com/dubzzz/fast-check/pull/4214)) CI: Rework another broken test on date
- ([PR#4136](https://github.com/dubzzz/fast-check/pull/4136)) Clean: Drop dependency @testing-library/jest-dom
- ([PR#4107](https://github.com/dubzzz/fast-check/pull/4107)) Doc: What's new article for fast-check 3.12.0
- ([PR#4118](https://github.com/dubzzz/fast-check/pull/4118)) Doc: Drop raw bench results from release note
- ([PR#4186](https://github.com/dubzzz/fast-check/pull/4186)) Doc: Document our approach to dual package
- ([PR#4187](https://github.com/dubzzz/fast-check/pull/4187)) Doc: Expose website as PWA too
- ([PR#4190](https://github.com/dubzzz/fast-check/pull/4190)) Move: Move the manifest in /static
- ([PR#4206](https://github.com/dubzzz/fast-check/pull/4206)) Refactor: Re-use null-proto helpers of `dictionary` on `anything`
- ([PR#4117](https://github.com/dubzzz/fast-check/pull/4117)) Test: Stabilize test related to NaN in exclusive mode
- ([PR#4189](https://github.com/dubzzz/fast-check/pull/4189)) Test: Drop Node 14.x from the test-chain
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting