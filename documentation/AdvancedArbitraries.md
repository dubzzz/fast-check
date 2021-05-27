# [:house:](../README.md) Advanced arbitraries

:warning: Before diving into the topic of *advanced arbitraries*, it is highly recommended to have in mind the [built-in arbitraries coming with fast-check](./Arbitraries.md).

This documentation covers the definition of new arbitraries. It can be an arbitrary derived from some existing ones or a totally new one.

Please do not hesitate to open issues to ask for new arbitraries.

## Table of contents

- [Derive existing arbitraries](#derive-existing-arbitraries)
  - [Filter values](#filter-values)
  - [Transform values](#transform-values)
  - [Transform arbitraries](#transform-arbitraries)
  - [Remove the shrinker](#remove-the-shrinker)
- [Build your own](#build-your-own)
  - [Starting at version 2.15.0](#starting-at-version-2.15.0)
  - [Before version 2.15.0](#before-version-2.15.0)
- [Advanced features of arbitraries](#advanced-features-of-arbitraries)
  - [Biased arbitraries](#biased-arbitraries)
  - [Shrinking](#shrinking)
  - [Cloneable](#cloneable)

## Derive existing arbitraries

All generated arbitraries inherit from the same base class: [Arbitrary](https://github.com/dubzzz/fast-check/blob/main/src/check/arbitrary/definition/Arbitrary.ts).

It comes with two useful methods: `filter(predicate: (t: T) => boolean): Arbitrary<T>` and `map<U>(mapper: (t: T) => U): Arbitrary<U>`. These methods are used internally by the framework to derive some Arbitraries from existing ones.

Additionaly it comes with `noShrink()` which derives an existing `Arbitrary<T>` into the same `Arbitrary<T>` without the shrink option.

### Filter values

`filter(predicate: (t: T) => boolean): Arbitrary<T>` can be used to filter undesirable values from the generated ones. It can be used as some kind of pre-requisite for the parameters required for your algorithm. For instance, you might need to generate two ordered integer values. One approach can be to use filter as follow:

```typescript
const minMax = fc.tuple(fc.integer(), fc.integer())
                    .filter(t => t[0] < t[1]);
```

But be aware that using `filter` may highly impact the time required to generate a valid entry. In the previous example, half of the generated tuples will be rejected. It can nontheless be a very useful and powerful tool to derive your arbitraries quickly and easily.

### Transform values

`map<U>(mapper: (t: T) => U): Arbitrary<U>` in its side does not filter any of the generated entries. It take one entry (generated or shrinked) and map it to another.

For instance the previous example could have been refactored as follow:

```typescript
const minMax = fc.tuple(fc.integer(), fc.integer())
                    .map(t => t[0] < t[1] ? [t[0], t[1]] : [t[1], t[0]]);
```


Another example would be to derive `fc.integer()` and `fc.array()` to build `fc.char()` and `fc.string()`:

```typescript
const char = () => fc.integer(0x20, 0x7e).map(String.fromCharCode);
const string = () => fc.array(fc.char()).map(arr => arr.join(''));
```

Most of the [built-in arbitraries](https://github.com/dubzzz/fast-check/tree/main/src/check/arbitrary) use this trick to define themselves.

### Transform arbitraries

`chain<U>(fmapper: (t: T) => Arbitrary<U>): Arbitrary<U>` (aka flatMap) It takes one entry from an Arbitrary and uses it to create a new Arbitrary based on that value.

:warning: Be aware that the shrinker of such construct might not be able to shrink as much as possible (more details on [this](https://github.com/dubzzz/fast-check/issues/650#issuecomment-648397230))

For example you can create arbitraries based on generated values:

```typescript
// generate an array of strings, all having the same length.
const RandomFixedLengthStringArb: Arbitrary<string[]> =
    fc.nat(100)
      .chain(length => fc.array(fc.string(length, length)));

// generate an array of 2-element arrays containing integer pairs
const BoundedPairsArb: Arbitrary<[number, number][]> = fc.nat().chain(bound => fc.array(fc.integer().map((leftBound: number): [number, number] => [leftBound, leftBound+bound])));

// generate a random sized substring of a string
const StringAndSubstringArb: Arbitrary<[string, string]> = fc.string(3,100).chain(fulltext => fc.tuple(fc.nat(fulltext.length-1), fc.nat(fulltext.length-1)).map(indexes => [fulltext, fulltext.slice(indexes[0], indexes[1]) ]))
```

### Remove the shrinker

Calling `noShrink()` on an `Arbitrary<T>` just remove the shrinker of the `Arbitrary<T>`. For instance, the following code will produce an `Arbitrary<number>` without shrinking operation.

```js
const intNoShrink = fc.integer().noShrink();
```

## Build your own

In general, whatever the version of fast-check you are using, it is highly recommended to have a look to how [built-in arbitraries](https://github.com/dubzzz/fast-check/tree/main/src/arbitrary) have been implementated and to the simpler [examples](https://github.com/dubzzz/fast-check/tree/main/example) provided in the repository.

### Starting at version 2.15.0

**Your version is 2.15.0 or above**

In such case, even if extending the [class `Arbitrary`](https://github.com/dubzzz/fast-check/blob/99e9b3b1c918a627d92138fc7e00f190ea99fecb/src/check/arbitrary/definition/Arbitrary.ts#L13) still works fine, it is highly recommended to extend the [class `NextArbitrary`](https://github.com/dubzzz/fast-check/blob/99e9b3b1c918a627d92138fc7e00f190ea99fecb/src/check/arbitrary/definition/NextArbitrary.ts#L12).

An instance of `NextArbitrary` must define three methods:
- `generate(mrng: Random, biasFactor: number | undefined): NextValue<T>`: Given a random generator and possibly a bias (≥2), it must generate a single value along with its context (if applicable). The context is an opaque value that should only be accessed by the class that produced it. This opaque value can be helpful to guide the shrinker and give it more context on the value, how it has been produced...
- `shrink(value: T, context?: unknown): Stream<NextValue<T>>`: Given a value and possibly a context (produced by `generate` or `shrink` of the very same instance), it has to produce a Stream of smaller values. Please note that the function always has to be called with a context except if `canGenerate` tells the caller that it can be called context-less for this precise value.
- `canGenerate(value: unknown): value is T`: Given a value it can tells the caller whether or not `shrink` can be called on it without passing a context. If the returned value is `false` then it means that this value should not be passed to `shrink` without its context.

But version 2.x of fast-check does not deal with instances of `NextArbitrary` from an API point-of-view so you need to convert them towards old instances using the helper `convertFromNext`. You can also convert old instances to new ones uisng `convertToNext`.

Since 2.15.0, most of the built-ins arbitraries coming with fast-check are based `NextArbitrary` hidden by a `convertFromNext`.

### Before version 2.15.0

**Your version is strictly older than 2.15.0**

In such case, you have to extend the [class `Arbitrary`](https://github.com/dubzzz/fast-check/blob/99e9b3b1c918a627d92138fc7e00f190ea99fecb/src/check/arbitrary/definition/Arbitrary.ts#L13).

It consists in a single method: `generate(mrng: Random): Shrinkable<T>`.
It takes a random number generator and it generates a value and the whole shrinking process to shrink it.

## Advanced features of arbitraries

### Biased arbitraries

Property based testing framework must be able to discover any kind of issues even very rare ones happening on some small values. For instance your algorithm might use magic numbers such as `-1`, `0` or others. Or fail when the input has duplicated values...

A common way to deal with those issues is:
- Solution A: only generate small values - *Issue: it fails to build large ones*
- Solution B: generate larger and larger entries - *Issue: what if the failing case requires both large and small values*

The choice made by fast-check is to bias the arbitrary 1 time over `freq`.

For `fc.integer`:
- 1 over `freq`: arbitrary between smaller values
- remaining: the full range arbitrary

For `fc.array`:
- 1 over `freq`:
  - 1 over `freq`: small array with biased values
  - remaining: full range array with biased values
- remaining: the full range arbitrary

### Shrinking

A basic way to implement a property based testing framework is to define arbitraries with the following structure:

```typescript
interface DummyArbitrary<Ts> {
    generate(mrng: Random): Ts;
    shrink(prev: Ts): Stream<Ts>;
}
```

Some frameworks actually use this approach. Unfortunately using this approach makes it impossible to shrink `oneof`. Indeed as soon as you have generated your value you do not know anymore who produced you.

Let's imagine you are using a `oneof(integer(0, 10), integer(20, 30))` relying on the `DummyArbitrary<number>` above. As soon as you have generated a value - a `number` - you cannot call shrink anymore as you do not know if it has been produced by `integer(0, 10)` or `integer(20, 30)` - in this precise case you can easily infer the producer.

For this reason, the `shrink` method is not part of `Arbitrary` in fast-check but is part of the values instantiated by `generate`.

### Cloneable

Any generated value having a key for `fc.cloneMethod` would be handled a bit differently during the execution. Indeed those values explicitly requires to be cloned before being transmitted again to the predicate.

Cloneable values can be seen as stateful values that would be altered as soon as we use them inside the predicate. For this precise reason they have to be recreated if they need to be used inside other runs of the predicate.

Example of usages:
- `fc.context`: is a stateful instance that gathers all the logs for a given predicate execution. In order to provide only the logs linked to the run itself it has to be cloned between all the runs
- stream structure

Example of a stream arbitrary:

```typescript
const streamInt = fc.nat()
    .map(seed => {
        return Object.assign(
            new SeededRandomStream(seed),
            { [fc.cloneMethod]: () => new SeededRandomStream(seed) }
        );
    });
```
