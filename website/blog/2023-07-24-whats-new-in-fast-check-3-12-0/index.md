---
title: What's new in fast-check 3.12.0?
authors: [dubzzz]
tags: [what's new, performance, arbitrary]
---

This release comes with some performance optimizations on `float`, `double` and `ulid`. It also adds the ability to define ranges with excluded boundaries in `float` and `double`

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Performance optimizations

### Faster decomposition of floating point values

When instanciating arbitraries for `float` and `double`, we rely on an algorithm able to compute the position of any floating point number in the range of all the existing values. For instance, the value 2<sup>-52</sup> is the 629,145,600<sup>th</sup> 32-bits float and the 1,018,167,296<sup>th</sup> 64-bits float.

This numbering makes us able to enumerate all the possible floating point numbers. For instance, the number right after 1 is 1.0000001192092896 for 32-bits floats and 1.0000009536743164 for 64-bits floats.

The algorithm responsible to find the index of any floating point number depends on a piece of code able to decompose any float into a significand and an exponent. Originally our implementation was made of one loop:

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

This implementation was pretty inefficient as we had to loop over 253 values. [@zbjornson](https://github.com/zbjornson) came up with an optimized version of it without any loop (see [#4059](https://github.com/dubzzz/fast-check/pull/4059)):

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

This optimization will speed-up the instanciation of any instance of `float` or `double` or any arbitrary derived from one of them.

### Higher throughput thanks to less allocations

Our initial implementation of `ulid` suffered from some performance issues. With 3.12.0, we are twice as fast with 3,191 ops/sec compared to 1,619 ops/sec on the code:

```ts
fc.assert(fc.property(fc.ulid(), (_unused) => true));
```

A significant part of the optimizations consisted into being more efficient in terms of memory footprint. Code like:

```ts
function pad(value: string, constLength: number) {
  return (
    Array(constLength - value.length)
      .fill('0')
      .join('') + value
  );
}
```

Got replaced by:

```ts
function pad(value: string, paddingLength: number) {
  let extraPadding = '';
  while (value.length + extraPadding.length < paddingLength) {
    extraPadding += '0';
  }
  return extraPadding + value;
}
```

Code like:

```ts
return [compute(a), compute(b), compute(c)].join('');
```

By:

```ts
return compute(a) + compute(b) + compute(c);
```

Code like:

```ts
const symbols = normalizedBase32str.split('').map((char) => decodeSymbolLookupTable[char]);
return symbols.reduce((prev, curr, i) => prev + curr * Math.pow(32, symbols.length - 1 - i), 0);
```

By:

```ts
let sum = 0;
for (let index = 0; index !== normalizedBase32str.length; ++index) {
  const char = normalizedBase32str[index];
  const symbol = decodeSymbolLookupTable[char];
  sum += symbol * Math.pow(32, normalizedBase32str.length - 1 - i);
}
return sum;
```

Most of our optimizations on allocations can be seen in [#4088](https://github.com/dubzzz/fast-check/pull/4088) and [#4091](https://github.com/dubzzz/fast-check/pull/4091).

While it was probably one of the simplest way to improve our performance, we also went through some optimizations at algorithm level in [#4092](https://github.com/dubzzz/fast-check/pull/4092) and some low level optimizations in [#4098](https://github.com/dubzzz/fast-check/pull/4098).

## Excluded min and max

Up-to-now our arbitraries for `float` and `double` were always including the `min` and `max` in the set of values to be generated. In other words when asking for `double({min: 0, max: 1})`, you ask for any value such as `0 ≤ value ≤ 1`. Asking for 1 not to be in the range requires the user to specify manually a value for the max close to 1 but not being 1.

In version 3.12.0, we add two new options:

- `minExcluded`: to exclude the min from the set of values
- `maxExcluded`: to exclude the max from the set of values

In other words, if in the example above you don't want to include the 1, you can write: `double({min: 0, max: 1, maxExcluded: true})` and you will get `0 ≤ value < 1`.

## Changelog since 3.11.0

The version 3.12.0 is based on version 3.11.0.
