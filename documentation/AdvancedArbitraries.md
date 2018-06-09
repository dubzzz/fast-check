# Advanced arbitraries

:warning: Before diving into the topic of *advanced arbitraries*, it is highly recommended to have in mind the [built-in arbitraries coming with fast-check](Arbitraries.md).

This documentation covers the definition of new arbitraries. It can be an arbitrary derived from some existing ones or a totally new one.

Please do not hesitate to open issues to ask for new arbitraries.

## Derive existing arbitraries

All generated arbitraries inherit from the same base class: [Arbitrary](https://github.com/dubzzz/fast-check/blob/master/src/check/arbitrary/definition/Arbitrary.ts).

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

Most of the [built-in arbitraries](https://github.com/dubzzz/fast-check/tree/master/src/check/arbitrary) use this trick to define themselves.

### Transform arbitraries

`chain<U>(fmapper: (t: T) => Arbitrary<U>): Arbitrary<U>` (aka flatMap) It takes one entry from an Arbitrary and uses it to create a new Arbitrary based on that value.

:warning: Be aware that the shrinker of such construct might not be able to shrink as much as possible

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

You can also fully customize your arbitrary: not derive it from any of the buit-in arbitraries. What you have to do is to extend [Arbitrary](https://github.com/dubzzz/fast-check/blob/master/src/check/arbitrary/definition/Arbitrary.ts) and implement `generate(mrng: Random): Shrinkable<T>`.

`generate` is responsable for the generation of one new random entity of type `T` (see signature above). In order to fulfill it in a deterministic way it receives a `mrng: Random`:
- `next(n: number): number`: uniformly distributed n bits value (max value of n = 31)
- `nextBoolean(): boolean`: uniformly distributed boolean value
- `nextInt(): number`: uniformly distributed integer value
- `nextInt(from: number, to: number): number`: uniformly distributed integer value between from (inclusive) and to (inclusive)
- `nextDouble(): number`: uniformly distributed double value between 0.0 (included) and 1.0 (not included)

The generated value is responsible for its shrinking. Shrinking derives the item into _smaller_ values and is optional.

Refer to [built-in types](https://github.com/dubzzz/fast-check/tree/master/src/check/arbitrary) for examples of custom arbitraries.