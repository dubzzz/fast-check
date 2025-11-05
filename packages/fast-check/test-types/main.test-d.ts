// Just a simple property, compiling a snippet importing fast-check
// should be enough to ensure that typings will not raise errors regarding incompatible
// and unknown syntaxes at build time

import fc from 'fast-check';
import { expectTypeOf } from 'vitest';

// assert
expectTypeOf(fc.assert(fc.property(fc.nat(), () => {}))).toEqualTypeOf<void>(); // Synchronous property means synchronous assert
expectTypeOf(fc.assert(fc.asyncProperty(fc.nat(), async () => {}))).toEqualTypeOf<Promise<void>>(); // Asynchronous property means asynchronous assert

// assert (beforeEach, afterEach)
// @ts-expect-error - Synchronous properties do not accept asynchronous beforeEach
fc.assert(fc.property(fc.nat(), () => {}).beforeEach(async () => {}));
// @ts-expect-error - Synchronous properties do not accept asynchronous afterEach
fc.assert(fc.property(fc.nat(), () => {}).afterEach(async () => {}));

// assert (reporter)
expectTypeOf(fc.assert(
    fc.property(fc.nat(), fc.string(), (_a, _b) => {}),
    { reporter: (_out: fc.RunDetails<[number, string]>) => {} },
  )).toEqualTypeOf<void>(); // Accept a reporter featuring the right types
// prettier-ignore
// @ts-expect-error - Reporter must be compatible with generated values
fc.assert(fc.property(fc.nat(), () => {}), { reporter: (_out: fc.RunDetails<[string, string]>) => {} });
// @ts-expect-error - Enforce users to declare all the generated values as arguments of the predicate
fc.property(fc.nat(), fc.string(), async (_a: number) => {});

// property
expectTypeOf(fc.property(fc.nat(), (_a) => {})).toMatchTypeOf<fc.IProperty<[number]>>(); // "property" instanciates instances compatible with IProperty
expectTypeOf(fc.property(fc.nat(), fc.string(), (_a, _b) => {})).toMatchTypeOf<fc.IProperty<[number, string]>>(); // "property" handles tuples
expectTypeOf(fc.assert(
    fc
      .property(fc.nat(), () => {})
      .beforeEach(() => 123)
      .afterEach(() => 'anything'),
  )).toEqualTypeOf<void>(); // Synchronous property accepts synchronous hooks
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.property(fc.nat(), fc.string(), (_a: number, _b: number) => {});

// asyncProperty
expectTypeOf(fc.asyncProperty(fc.nat(), async (_a) => {})).toMatchTypeOf<fc.IAsyncProperty<[number]>>(); // "asyncProperty" instanciates instances compatible with IAsyncProperty
expectTypeOf(fc.asyncProperty(fc.nat(), fc.string(), async (_a, _b) => {})).toMatchTypeOf<fc.IAsyncProperty<[number, string]>>(); // "asyncProperty" handles tuples
expectTypeOf(fc
    .asyncProperty(fc.nat(), async (_a) => {})
    .beforeEach(async () => 123)
    .afterEach(async () => 'anything')).toMatchTypeOf<fc.IAsyncProperty<[number]>>(); // Asynchronous property accepts asynchronous hooks
expectTypeOf(fc
    .asyncProperty(fc.nat(), async (_a) => {})
    .beforeEach(() => 123)
    .afterEach(() => 'anything')).toMatchTypeOf<fc.IAsyncProperty<[number]>>(); // Asynchronous property accepts synchronous hooks
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.asyncProperty(fc.nat(), fc.string(), async (_a: number, _b: number) => {});
// @ts-expect-error - Enforce users to declare all the generated values as arguments of the predicate
fc.asyncProperty(fc.nat(), fc.string(), async (_a: number) => {});

// base arbitrary (chain)
expectTypeOf(fc.nat().chain((n) => fc.array(fc.string(), { maxLength: n }))).toEqualTypeOf<fc.Arbitrary<string[]>>(); // Type of "chain" corresponds to the return type of the passed lambda
expectTypeOf(fc.constantFrom(1, 2, 3).chain((value) => fc.constant(value))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 3>>(); // Type of "chain" corresponds to the return type of the passed lambda
expectTypeOf(// without the as, TypeScript refused to compile as constantFrom requires t least one argument
  fc.constantFrom(...([1, 2, 3] as [1, 2, 3])).chain((value) => fc.constant(value))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 3>>(); // Type of "chain" should not simplify the type to something more general (no "1 -> number" expected)

// base arbitrary (filter)
expectTypeOf(fc.option(fc.nat()).filter((n): n is number => n !== null)).toEqualTypeOf<fc.Arbitrary<number>>(); // "filter" preserves the source type

// base arbitrary (map)
expectTypeOf(fc.nat().map((n) => String(n))).toEqualTypeOf<fc.Arbitrary<string>>(); // "map" alters the resulting type

// constant arbitrary
expectTypeOf(fc.constant(1)).toEqualTypeOf<fc.Arbitrary<1>>(); // By default, "constant" preserves the precise type
expectTypeOf(fc.constant<number>(1)).toEqualTypeOf<fc.Arbitrary<number>>(); // But it also accepts to receive the type

// constantFrom arbitrary
expectTypeOf(fc.constantFrom(1, 2)).toEqualTypeOf<fc.Arbitrary<1 | 2>>(); // By default, "constantFrom" preserves the precise type
expectTypeOf(fc.constantFrom<number[]>(1, 2)).toEqualTypeOf<fc.Arbitrary<number>>(); // But it also accepts to receive the type
expectTypeOf(fc.constantFrom(...([1, 2] as const))).toEqualTypeOf<fc.Arbitrary<1 | 2>>(); // "as const" was a way to prevent extra simplification of "constantFrom", it\'s now not needed anymore
expectTypeOf(fc.constantFrom(1, 2, 'hello')).toEqualTypeOf<fc.Arbitrary<number | string>>(); // "constantFrom" accepts arguments not having the same types without any typing trick
expectTypeOf(fc.constantFrom(...([1, 2, 'hello'] as const))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 'hello'>>(); // "as const" was a way to prevent extra simplification of "constantFrom"

// uniqueArray arbitrary
expectTypeOf(fc.uniqueArray(fc.string())).toEqualTypeOf<fc.Arbitrary<string[]>>(); // simple arrays of unique values
expectTypeOf(fc.uniqueArray(fc.record({ name: fc.string() }), {
    selector: (item) => item.name,
  })).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>(); // arrays of unique values based on a selector
expectTypeOf(fc.uniqueArray(fc.record({ name: fc.string() }), {
    comparator: (itemA, itemB) => itemA.name === itemB.name,
  })).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>(); // arrays of unique values using a custom comparison function
expectTypeOf(fc.uniqueArray(fc.record({ name: fc.string() }), {
    // Ideally we should not need to explicitely type `itemA`, but so far it is needed
    comparator: (itemA: { toto: string }, itemB) => itemA.toto === itemB.toto,
    selector: (item) => ({ toto: item.name }),
  })).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>(); // arrays of unique values using a custom comparison function and a complex selector (need an explicit typing)
declare const constraintsUniqueArray1: fc.UniqueArrayConstraints<{ name: string }, { toto: string }>;
expectTypeOf(fc.uniqueArray(fc.record({ name: fc.string() }), constraintsUniqueArray1)).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>(); // arrays of unique values accept the aggregated type as input

fc.uniqueArray(fc.record({ name: fc.string() }), {
  // @ts-expect-error - Custom comparison function is not compatible with default selector
  comparator: (itemA, itemB) => itemA.toto === itemB.toto,
});
// @ts-expect-error - Custom comparison function is not compatible with default selector even if explicitely specifying a wrong type
fc.uniqueArray(fc.record({ name: fc.string() }), {
  comparator: (itemA: { toto: string }, itemB: { toto: string }) => itemA.toto === itemB.toto,
});
fc.uniqueArray(fc.record({ name: fc.string() }), {
  // @ts-expect-error - Custom comparison function is not compatible with provided selector
  comparator: (itemA, itemB) => itemA.toto === itemB.toto,
  selector: (item) => item.name,
});
fc.uniqueArray(fc.record({ name: fc.string() }), {
  comparator: (itemA: { toto: string }, itemB: { toto: string }) => itemA.toto === itemB.toto,
  // @ts-expect-error - Custom comparison function is not compatible with provided selector even if explicitely specifying a wrong type
  selector: (item) => item.name,
});

// record arbitrary
declare const mySymbol1: unique symbol;
declare const mySymbol2: unique symbol;
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() })).toEqualTypeOf<fc.Arbitrary<{ a: number; b: string }>>(); // "record" can contain multiple types
expectTypeOf(fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() })).toEqualTypeOf<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]: string }>>(); // "record" can be indexed using unique symbols as keys
// Related to https://github.com/microsoft/TypeScript/issues/27525:
//expectType<fc.Arbitrary<{ [Symbol.iterator]: number; [mySymbol2]: string }>>()(
//  fc.record({ [Symbol.iterator]: fc.nat(), [mySymbol2]: fc.string() }),
//  '"record" can be indexed using known symbols as keys'
//);
// Workaround for known symbols not defined as unique ones:
//const symbolIterator: unique symbol = Symbol.iterator as any;
//expectType<fc.Arbitrary<{ [symbolIterator]: number; [mySymbol2]: string }>>()(
//  fc.record({ [symbolIterator]: fc.nat(), [mySymbol2]: fc.string() }),
//  '"record" can be indexed using known symbols as keys based on a workaround'
//);
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, {})).toEqualTypeOf<fc.Arbitrary<{ a: number; b: string }>>(); // "record" accepts empty constraints
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] })).toEqualTypeOf<fc.Arbitrary<{ a?: number; b?: string }>>(); // "record" only applies optional on keys declared within requiredKeys even when empty
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['a'] })).toEqualTypeOf<fc.Arbitrary<{ a: number; b?: string }>>(); // "record" only applies optional on keys declared within requiredKeys even if unique
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string(), c: fc.string() }, { requiredKeys: ['a', 'c'] })).toEqualTypeOf<fc.Arbitrary<{ a: number; b?: string; c: string }>>(); // "record" only applies optional on keys declared within requiredKeys even if multiple ones specified
// prettier-ignore
// @fc-expect-error-require-exactOptionalPropertyTypes
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] })).toEqualTypeOf<fc.Arbitrary<{ a?: number; b?: string | undefined }>>(); // "record" only applies optional on keys declared within requiredKeys by adding ? without |undefined
// prettier-ignore-end
expectTypeOf(fc.record({ a: fc.nat(), b: fc.option(fc.string(), { nil: undefined }) }, { requiredKeys: [] })).toEqualTypeOf<fc.Arbitrary<{ a?: number; b?: string | undefined }>>(); // "record" only applies optional on keys declared within requiredKeys and preserves existing |undefined when adding ?
expectTypeOf(fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [mySymbol1] as [typeof mySymbol1] })).toEqualTypeOf<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string }>>(); // "record" only applies optional on keys declared within requiredKeys even if it contains symbols
// Related to https://github.com/microsoft/TypeScript/issues/27525
//expectType<fc.Arbitrary<{ [Symbol.iterator]: number; [mySymbol2]?: string }>>()(
//  fc.record({ [Symbol.iterator]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [Symbol.iterator] })
//);
// See workaround above
expectTypeOf(fc.record(
    { [mySymbol1]: fc.nat(), [mySymbol2]: fc.string(), a: fc.nat(), b: fc.string() },
    { requiredKeys: [mySymbol1, 'a'] as [typeof mySymbol1, 'a'] },
  )).toEqualTypeOf<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string; a: number; b?: string }>>(); // "record" only applies optional on keys declared within requiredKeys even if it contains symbols and normal keys
type Query = { data: { field: 'X' } };
expectTypeOf(// issue 1453
  fc.record<Query>({ data: fc.record({ field: fc.constant('X') }) })).toEqualTypeOf<fc.Arbitrary<Query>>(); // "record" can be passed the requested type in <*>
expectTypeOf(// issue 1453
  fc.record<Partial<Query>>({ data: fc.record({ field: fc.constant('X') }) })).toEqualTypeOf<fc.Arbitrary<Partial<Query>>>(); // "record" can be passed something assignable to the requested type in <*>
// @ts-expect-error - requiredKeys references an unknown key
fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['c'] });
// @ts-expect-error - record expects arbitraries not raw values
fc.record({ a: 1 });

// dictionary arbitrary
expectTypeOf(fc.dictionary(fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<string, number>>>(); // String key call to "dictionary"
expectTypeOf(fc.dictionary<number>(fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<string, number>>>(); // String key call to "dictionary" with single generic
expectTypeOf(fc.dictionary<string, number>(fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<string, number>>>(); // String key call to "dictionary" with two generics
expectTypeOf(fc.dictionary(fc.nat(), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<number, number>>>(); // Number key call to "dictionary"
expectTypeOf(fc.dictionary<number, number>(fc.nat(), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<number, number>>>(); // Number key call to "dictionary" with generics
expectTypeOf(fc.dictionary(fc.string().map(Symbol), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<symbol, number>>>(); // Symbol key call to "dictionary"
expectTypeOf(fc.dictionary<symbol, number>(fc.string().map(Symbol), fc.nat())).toEqualTypeOf<fc.Arbitrary<Record<symbol, number>>>(); // Symbol key call to "dictionary" with generics
// @ts-expect-error - dictionary expects arbitraries producing PropertyKey for keys
fc.dictionary(fc.anything(), fc.string());

// tuple arbitrary
expectTypeOf(fc.tuple()).toEqualTypeOf<fc.Arbitrary<[]>>(); // "tuple" with zero argument
expectTypeOf(fc.tuple(fc.nat())).toEqualTypeOf<fc.Arbitrary<[number]>>(); // "tuple" with a single argument
expectTypeOf(fc.tuple(fc.nat(), fc.string())).toEqualTypeOf<fc.Arbitrary<[number, string]>>(); // "tuple" with multiple arguments
expectTypeOf(fc.tuple(...([] as fc.Arbitrary<number>[]))).toEqualTypeOf<fc.Arbitrary<number[]>>(); // "tuple" with spread arrays
// @ts-expect-error - tuple expects arbitraries not raw values
fc.tuple(fc.nat(), '');

// oneof arbitrary
expectTypeOf(fc.oneof(fc.string(), fc.string({ unit: 'binary' }))).toEqualTypeOf<fc.Arbitrary<string>>(); // "oneof" with multiple arguments having the same type
expectTypeOf(fc.oneof(fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with multiple arguments of different types
expectTypeOf(fc.oneof({}, fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with different types and empty constraints
expectTypeOf(fc.oneof({ withCrossShrink: true }, fc.string(), fc.nat())).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with different types and some constraints
expectTypeOf(fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.string({ unit: 'binary' }), weight: 1 })).toEqualTypeOf<fc.Arbitrary<string>>(); // "oneof" with weighted arbitraries and multiple arguments having the same type
expectTypeOf(fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 })).toEqualTypeOf<fc.Arbitrary<number | string>>(); // "oneof" with weighted arbitraries and multiple arguments of different types
expectTypeOf(fc.oneof({}, { arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 })).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with weighted arbitraries and different types and empty constraints
expectTypeOf(fc.oneof({ withCrossShrink: true }, { arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 })).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with weighted arbitraries and different types and some constraints
expectTypeOf(fc.oneof({ withCrossShrink: true }, { arbitrary: fc.string(), weight: 1 }, fc.nat())).toEqualTypeOf<fc.Arbitrary<string | number>>(); // "oneof" with weighted arbitraries and non-weighted arbitraries
expectTypeOf(fc.oneof(...([] as fc.Arbitrary<number>[]))).toEqualTypeOf<fc.Arbitrary<number>>(); // "oneof" from array of arbitraries
expectTypeOf(fc.oneof()).toEqualTypeOf<fc.Arbitrary<never>>(); // "oneof" must receive at least one arbitrary

// @ts-expect-error - oneof expects arbitraries not raw values
fc.oneof(fc.string(), '1');
// @ts-expect-error - oneof expects weighted arbitraries with real arbitrraies and not raw values
fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: '1', weight: 1 });

// option arbitrary
expectTypeOf(fc.option(fc.nat())).toEqualTypeOf<fc.Arbitrary<number | null>>(); // "option" without any constraints
expectTypeOf(fc.option(fc.nat(), { nil: null })).toEqualTypeOf<fc.Arbitrary<number | null>>(); // "option" with nil overriden to null (the original default)
expectTypeOf(fc.option(fc.nat(), { nil: 'custom_default' as const })).toEqualTypeOf<fc.Arbitrary<number | 'custom_default'>>(); // "option" with nil overriden to custom value
// @ts-expect-error - option expects arbitraries not raw values
fc.option(1);

// tie arbitrary
expectTypeOf(fc.letrec((_tie) => ({}))).toEqualTypeOf<{}>(); // Empty "letrec"
expectTypeOf(fc.letrec<{}>((_tie) => ({}))).toEqualTypeOf<{}>(); // Empty "letrec" with types manually defined
expectTypeOf(fc.letrec((_tie) => ({
    a: fc.nat(),
    b: fc.string(),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>(); // No recursion "letrec"
expectTypeOf(fc.letrec<{ a: number; b: string }>((_tie) => ({
    a: fc.nat(),
    b: fc.string(),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>(); // No recursion "letrec" with types manually defined
expectTypeOf(fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>(); // Recursive "letrec" // TODO Typings should be improved: b type might be infered from a
expectTypeOf(fc.letrec<{ a: number; b: number }>((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<number> }>(); // Recursive "letrec" with types manually defined
expectTypeOf(fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>(); // Invalid recursion "letrec" // TODO Typings should be improved: referencing an undefined key should failed
expectTypeOf(fc.letrec<{ a: number; b: unknown }>((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>(); // Invalid recursion "letrec" with types manually defined // TODO Even when fully typed we accept undeclared keys from being used on tie (see why PR-2968)
expectTypeOf(fc.letrec<{ a: number }>((_tie) => ({
    a: fc.nat(),
    b: fc.nat(),
  }))).toEqualTypeOf<{ a: fc.Arbitrary<number> }>(); // Accept additional keys within "letrec" but do not expose them outside
fc.letrec<{ a: string }>((_tie) => ({
  // @ts-expect-error - reject builders implying 'wrongly typed keys' when type declared
  a: fc.nat(),
}));

// clone arbitrary
expectTypeOf(fc.clone(fc.nat(), 0)).toEqualTypeOf<fc.Arbitrary<[]>>(); // "clone" 0-time
expectTypeOf(fc.clone(fc.nat(), 1)).toEqualTypeOf<fc.Arbitrary<[number]>>(); // "clone" 1-time
expectTypeOf(fc.clone(fc.nat(), 2)).toEqualTypeOf<fc.Arbitrary<[number, number]>>(); // "clone" 2-times
expectTypeOf(fc.clone(fc.nat(), 3)).toEqualTypeOf<fc.Arbitrary<[number, number, number]>>(); // "clone" 3-times
expectTypeOf(fc.clone(fc.nat(), 4)).toEqualTypeOf<fc.Arbitrary<[number, number, number, number]>>(); // "clone" 4-times
expectTypeOf(fc.clone(fc.nat(), 5)).toEqualTypeOf<fc.Arbitrary<[number, number, number, number, number]>>(); // "clone" 5-times
declare const nTimesClone: number;
expectTypeOf(fc.clone(fc.nat(), nTimesClone)).toEqualTypeOf<fc.Arbitrary<number[]>>(); // "clone" with non-precise number of times

// func arbitrary
expectTypeOf(fc.func(fc.nat())).toEqualTypeOf<fc.Arbitrary<() => number>>(); // "func" producing "nat"
// @ts-expect-error - func expects arbitraries not raw values
fc.func(1);

// falsy arbitary
expectTypeOf(fc.falsy()).toEqualTypeOf<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>(); // falsy" without any constraints
expectTypeOf(fc.falsy({})).toEqualTypeOf<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>(); // falsy" with empty constraints
expectTypeOf(fc.falsy({ withBigInt: false })).toEqualTypeOf<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>(); // falsy" with withBigInt=false
expectTypeOf(fc.falsy({ withBigInt: true })).toEqualTypeOf<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined | 0n>>(); // falsy" with withBigInt=true

// configureGlobal
expectTypeOf(fc.configureGlobal({ reporter: (_out: fc.RunDetails<unknown>) => {} })).toEqualTypeOf<void>(); // "configureGlobal" with custom reporter
// FIXME // @ts-expect-error - reporter cannot be defined with precise type on configureGlobal
//fc.configureGlobal({ reporter: (out: fc.RunDetails<[number]>) => {} });
