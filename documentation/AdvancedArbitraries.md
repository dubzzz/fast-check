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
- [Advanced features of arbitraries](#advanced-features-of-arbitraries)
  - [Biased arbitraries](#biased-arbitraries)
  - [Shrinking](#shrinking)
  - [Cloneable](#cloneable)

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

**NOTE:** Before writing your own arbitrary from scratch you should have a look to the [examples](https://github.com/dubzzz/fast-check/tree/master/example) provided in the repository. There are examples for: [recursive structures](https://github.com/dubzzz/fast-check/tree/master/example/002-recursive/isSearchTree), [properties for automata or state machine](https://github.com/dubzzz/fast-check/tree/master/example/004-stateMachine/musicPlayer) and others.

You can also fully customize your arbitrary: not derive it from any of the buit-in arbitraries. What you have to do is to extend [Arbitrary](https://github.com/dubzzz/fast-check/blob/master/src/check/arbitrary/definition/Arbitrary.ts) and implement `generate(mrng: Random): Shrinkable<T>`.

`generate` is responsable for the generation of one new random entity of type `T` (see signature above). In order to fulfill it in a deterministic way it receives a `mrng: Random`:
- `next(n: number): number`: uniformly distributed n bits value (max value of n = 31)
- `nextBoolean(): boolean`: uniformly distributed boolean value
- `nextInt(): number`: uniformly distributed integer value
- `nextInt(from: number, to: number): number`: uniformly distributed integer value between from (inclusive) and to (inclusive)
- `nextDouble(): number`: uniformly distributed double value between 0.0 (included) and 1.0 (not included)

The generated value is responsible for its shrinking. Shrinking derives the item into _smaller_ values and is optional.

Refer to [built-in types](https://github.com/dubzzz/fast-check/tree/master/src/check/arbitrary) for examples of fully custom arbitraries.

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
