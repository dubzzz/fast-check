// Just a simple property, compiling a snippet importing fast-check
// should be enough to ensure that typings will not raise errors regarding incompatible
// and unknown syntaxes at build time

import fc from 'fast-check';
import { expectTypeOf } from 'vitest';

// assert
// Synchronous property means synchronous assert
expectTypeOf(fc.assert(fc.property(fc.nat(), () => {}))).toEqualTypeOf<void>();
// Asynchronous property means asynchronous assert
expectTypeOf(fc.assert(fc.asyncProperty(fc.nat(), async () => {}))).toEqualTypeOf<Promise<void>>();

// assert (beforeEach, afterEach)
// @ts-expect-error - Synchronous properties do not accept asynchronous beforeEach
fc.assert(fc.property(fc.nat(), () => {}).beforeEach(async () => {}));
// @ts-expect-error - Synchronous properties do not accept asynchronous afterEach
fc.assert(fc.property(fc.nat(), () => {}).afterEach(async () => {}));

// assert (reporter)
// Accept a reporter featuring the right types
expectTypeOf(
  fc.assert(
    fc.property(fc.nat(), fc.string(), (_a, _b) => {}),
    { reporter: (_out: fc.RunDetails<[number, string]>) => {} },
  ),
).toEqualTypeOf<void>();
// prettier-ignore
// @ts-expect-error - Reporter must be compatible with generated values
fc.assert(fc.property(fc.nat(), () => {}), { reporter: (_out: fc.RunDetails<[string, string]>) => {} });
// @ts-expect-error - Enforce users to declare all the generated values as arguments of the predicate
fc.property(fc.nat(), fc.string(), async (_a: number) => {});

// property
// "property" instanciates instances compatible with IProperty
expectTypeOf(fc.property(fc.nat(), (_a) => {})).toMatchTypeOf<fc.IProperty<[number]>>();
// "property" handles tuples
expectTypeOf(fc.property(fc.nat(), fc.string(), (_a, _b) => {})).toMatchTypeOf<fc.IProperty<[number, string]>>();
// Synchronous property accepts synchronous hooks
expectTypeOf(
  fc.assert(
    fc
      .property(fc.nat(), () => {})
      .beforeEach(() => 123)
      .afterEach(() => 'anything'),
  ),
).toEqualTypeOf<void>();
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.property(fc.nat(), fc.string(), (_a: number, _b: number) => {});

// asyncProperty
// "asyncProperty" instanciates instances compatible with IAsyncProperty
expectTypeOf(fc.asyncProperty(fc.nat(), async (_a) => {})).toMatchTypeOf<fc.IAsyncProperty<[number]>>();
// "asyncProperty" handles tuples
expectTypeOf(fc.asyncProperty(fc.nat(), fc.string(), async (_a, _b) => {})).toMatchTypeOf<fc.IAsyncProperty<[number, string]>>();
// Asynchronous property accepts asynchronous hooks
expectTypeOf(
  fc
    .asyncProperty(fc.nat(), async (_a) => {})
    .beforeEach(async () => 123)
    .afterEach(async () => 'anything'),
).toMatchTypeOf<fc.IAsyncProperty<[number]>>();
// Asynchronous property accepts synchronous hooks
expectTypeOf(
  fc
    .asyncProperty(fc.nat(), async (_a) => {})
    .beforeEach(() => 123)
    .afterEach(() => 'anything'),
).toMatchTypeOf<fc.IAsyncProperty<[number]>>();
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.asyncProperty(fc.nat(), fc.string(), async (_a: number, _b: number) => {});
// @ts-expect-error - Enforce users to declare all the generated values as arguments of the predicate
fc.asyncProperty(fc.nat(), fc.string(), async (_a: number) => {});

// base arbitrary (chain)
// Type of "chain" corresponds to the return type of the passed lambda
expectTypeOf(fc.nat().chain((n) => fc.array(fc.string(), { maxLength: n }))).toEqualTypeOf<fc.Arbitrary<string[]>>();
// Type of "chain" corresponds to the return type of the passed lambda
expectTypeOf(fc.constantFrom(1, 2, 3).chain((value) => fc.constant(value))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 3>>();
// Type of "chain" should not simplify the type to something more general (no "1 -> number" expected)
// without the as, TypeScript refused to compile as constantFrom requires t least one argument
expectTypeOf(fc.constantFrom(...([1, 2, 3] as [1, 2, 3])).chain((value) => fc.constant(value))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 3>>();

// base arbitrary (filter)
// "filter" preserves the source type
expectTypeOf(fc.option(fc.nat()).filter((n): n is number => n !== null)).toEqualTypeOf<fc.Arbitrary<number>>();

// base arbitrary (map)
// "map" alters the resulting type
expectTypeOf(fc.nat().map((n) => String(n))).toEqualTypeOf<fc.Arbitrary<string>>();

// constant arbitrary
// By default, "constant" preserves the precise type
expectTypeOf(fc.constant(1)).toEqualTypeOf<fc.Arbitrary<1>>();
// But it also accepts to receive the type
expectTypeOf(fc.constant<number>(1)).toEqualTypeOf<fc.Arbitrary<number>>();

// constantFrom arbitrary
// By default, "constantFrom" preserves the precise type
expectTypeOf(fc.constantFrom(1, 2)).toEqualTypeOf<fc.Arbitrary<1 | 2>>();
// But it also accepts to receive the type
expectTypeOf(fc.constantFrom<number[]>(1, 2)).toEqualTypeOf<fc.Arbitrary<number>>();
// "as const" was a way to prevent extra simplification of "constantFrom", it's now not needed anymore
expectTypeOf(fc.constantFrom(...([1, 2] as const))).toEqualTypeOf<fc.Arbitrary<1 | 2>>();
// "constantFrom" accepts arguments not having the same types without any typing trick
expectTypeOf(fc.constantFrom(1, 2, 'hello')).toEqualTypeOf<fc.Arbitrary<number | string>>();
// "as const" was a way to prevent extra simplification of "constantFrom"
expectTypeOf(fc.constantFrom(...([1, 2, 'hello'] as const))).toEqualTypeOf<fc.Arbitrary<1 | 2 | 'hello'>>();

// uniqueArray arbitrary
// simple arrays of unique values
expectTypeOf(fc.uniqueArray(fc.string())).toEqualTypeOf<fc.Arbitrary<string[]>>();
// arrays of unique values based on a selector
expectTypeOf(
  fc.uniqueArray(fc.record({ name: fc.string() }), {
    selector: (item) => item.name,
  }),
).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>();
// arrays of unique values using a custom comparison function
expectTypeOf(
  fc.uniqueArray(fc.record({ name: fc.string() }), {
    comparator: (itemA, itemB) => itemA.name === itemB.name,
  }),
).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>();
// arrays of unique values using a custom comparison function and a complex selector (need an explicit typing)
// Ideally we should not need to explicitely type `itemA`, but so far it is needed
expectTypeOf(
  fc.uniqueArray(fc.record({ name: fc.string() }), {
    comparator: (itemA: { toto: string }, itemB) => itemA.toto === itemB.toto,
    selector: (item) => ({ toto: item.name }),
  }),
).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>();
// arrays of unique values accept the aggregated type as input
declare const constraintsUniqueArray1: fc.UniqueArrayConstraints<{ name: string }, { toto: string }>;
expectTypeOf(fc.uniqueArray(fc.record({ name: fc.string() }), constraintsUniqueArray1)).toEqualTypeOf<fc.Arbitrary<{ name: string }[]>>();

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
// "record" can contain multiple types
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() })).toEqualTypeOf<fc.Arbitrary<{ a: number; b: string }>>();
// "record" can be indexed using unique symbols as keys
expectTypeOf(fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() })).toEqualTypeOf<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]: string }>>();
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
// "record" accepts empty constraints
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, {})).toEqualTypeOf<fc.Arbitrary<{ a: number; b: string }>>();
// "record" only applies optional on keys declared within requiredKeys even when empty
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] })).toEqualTypeOf<fc.Arbitrary<{ a?: number; b?: string }>>();
// "record" only applies optional on keys declared within requiredKeys even if unique
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['a'] })).toEqualTypeOf<fc.Arbitrary<{ a: number; b?: string }>>();
// "record" only applies optional on keys declared within requiredKeys even if multiple ones specified
expectTypeOf(fc.record({ a: fc.nat(), b: fc.string(), c: fc.string() }, { requiredKeys: ['a', 'c'] })).toEqualTypeOf<fc.Arbitrary<{ a: number; b?: string; c: string }>>();
// prettier-ignore
// @fc-expect-error-require-exactOptionalPropertyTypes
expectType<fc.Arbitrary<{ a?: number; b?: string | undefined }>>()(fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] }), '"record" only applies optional on keys declared within requiredKeys by adding ? without |undefined');
// prettier-ignore-end
expectType<fc.Arbitrary<{ a?: number; b?: string | undefined }>>()(
  fc.record({ a: fc.nat(), b: fc.option(fc.string(), { nil: undefined }) }, { requiredKeys: [] }),
  '"record" only applies optional on keys declared within requiredKeys and preserves existing |undefined when adding ?',
);
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string }>>()(
  fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [mySymbol1] as [typeof mySymbol1] }),
  '"record" only applies optional on keys declared within requiredKeys even if it contains symbols',
);
// Related to https://github.com/microsoft/TypeScript/issues/27525
//expectType<fc.Arbitrary<{ [Symbol.iterator]: number; [mySymbol2]?: string }>>()(
//  fc.record({ [Symbol.iterator]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [Symbol.iterator] })
//);
// See workaround above
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string; a: number; b?: string }>>()(
  fc.record(
    { [mySymbol1]: fc.nat(), [mySymbol2]: fc.string(), a: fc.nat(), b: fc.string() },
    { requiredKeys: [mySymbol1, 'a'] as [typeof mySymbol1, 'a'] },
  ),
  '"record" only applies optional on keys declared within requiredKeys even if it contains symbols and normal keys',
);
type Query = { data: { field: 'X' } };
expectType<fc.Arbitrary<Query>>()(
  // issue 1453
  fc.record<Query>({ data: fc.record({ field: fc.constant('X') }) }),
  '"record" can be passed the requested type in <*>',
);
expectType<fc.Arbitrary<Partial<Query>>>()(
  // issue 1453
  fc.record<Partial<Query>>({ data: fc.record({ field: fc.constant('X') }) }),
  '"record" can be passed something assignable to the requested type in <*>',
);
// @ts-expect-error - requiredKeys references an unknown key
fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['c'] });
// @ts-expect-error - record expects arbitraries not raw values
fc.record({ a: 1 });

// dictionary arbitrary
expectType<fc.Arbitrary<Record<string, number>>>()(
  fc.dictionary(fc.string(), fc.nat()),
  'String key call to "dictionary"',
);
expectType<fc.Arbitrary<Record<string, number>>>()(
  fc.dictionary<number>(fc.string(), fc.nat()),
  'String key call to "dictionary" with single generic',
);
expectType<fc.Arbitrary<Record<string, number>>>()(
  fc.dictionary<string, number>(fc.string(), fc.nat()),
  'String key call to "dictionary" with two generics',
);
expectType<fc.Arbitrary<Record<number, number>>>()(
  fc.dictionary(fc.nat(), fc.nat()),
  'Number key call to "dictionary"',
);
expectType<fc.Arbitrary<Record<number, number>>>()(
  fc.dictionary<number, number>(fc.nat(), fc.nat()),
  'Number key call to "dictionary" with generics',
);
expectType<fc.Arbitrary<Record<symbol, number>>>()(
  fc.dictionary(fc.string().map(Symbol), fc.nat()),
  'Symbol key call to "dictionary"',
);
expectType<fc.Arbitrary<Record<symbol, number>>>()(
  fc.dictionary<symbol, number>(fc.string().map(Symbol), fc.nat()),
  'Symbol key call to "dictionary" with generics',
);
// @ts-expect-error - dictionary expects arbitraries producing PropertyKey for keys
fc.dictionary(fc.anything(), fc.string());

// map arbitrary
expectType<fc.Arbitrary<Map<string, number>>>()(fc.map(fc.string(), fc.nat()), 'Basic call to "map"');
expectType<fc.Arbitrary<Map<string, number>>>()(
  fc.map<string, number>(fc.string(), fc.nat()),
  'Call to "map" with generics',
);

// tuple arbitrary
expectType<fc.Arbitrary<[]>>()(fc.tuple(), '"tuple" with zero argument');
expectType<fc.Arbitrary<[number]>>()(fc.tuple(fc.nat()), '"tuple" with a single argument');
expectType<fc.Arbitrary<[number, string]>>()(fc.tuple(fc.nat(), fc.string()), '"tuple" with multiple arguments');
expectType<fc.Arbitrary<number[]>>()(fc.tuple(...([] as fc.Arbitrary<number>[])), '"tuple" with spread arrays');
// @ts-expect-error - tuple expects arbitraries not raw values
fc.tuple(fc.nat(), '');

// oneof arbitrary
expectType<fc.Arbitrary<string>>()(
  fc.oneof(fc.string(), fc.string({ unit: 'binary' })),
  '"oneof" with multiple arguments having the same type',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof(fc.string(), fc.nat()),
  '"oneof" with multiple arguments of different types',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof({}, fc.string(), fc.nat()),
  '"oneof" with different types and empty constraints',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof({ withCrossShrink: true }, fc.string(), fc.nat()),
  '"oneof" with different types and some constraints',
);
expectType<fc.Arbitrary<string>>()(
  fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.string({ unit: 'binary' }), weight: 1 }),
  '"oneof" with weighted arbitraries and multiple arguments having the same type',
);
expectType<fc.Arbitrary<number | string>>()(
  fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 }),
  '"oneof" with weighted arbitraries and multiple arguments of different types',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof({}, { arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 }),
  '"oneof" with weighted arbitraries and different types and empty constraints',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof({ withCrossShrink: true }, { arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 }),
  '"oneof" with weighted arbitraries and different types and some constraints',
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof({ withCrossShrink: true }, { arbitrary: fc.string(), weight: 1 }, fc.nat()),
  '"oneof" with weighted arbitraries and non-weighted arbitraries',
);
expectType<fc.Arbitrary<number>>()(fc.oneof(...([] as fc.Arbitrary<number>[])), '"oneof" from array of arbitraries');
expectType<fc.Arbitrary<never>>()(fc.oneof(), '"oneof" must receive at least one arbitrary');

// @ts-expect-error - oneof expects arbitraries not raw values
fc.oneof(fc.string(), '1');
// @ts-expect-error - oneof expects weighted arbitraries with real arbitrraies and not raw values
fc.oneof({ arbitrary: fc.string(), weight: 1 }, { arbitrary: '1', weight: 1 });

// option arbitrary
expectType<fc.Arbitrary<number | null>>()(fc.option(fc.nat()), '"option" without any constraints');
expectType<fc.Arbitrary<number | null>>()(
  fc.option(fc.nat(), { nil: null }),
  '"option" with nil overriden to null (the original default)',
);
expectType<fc.Arbitrary<number | 'custom_default'>>()(
  fc.option(fc.nat(), { nil: 'custom_default' as const }),
  '"option" with nil overriden to custom value',
);
// @ts-expect-error - option expects arbitraries not raw values
fc.option(1);

// tie arbitrary
// Empty "letrec"
expectTypeOf(
  fc.letrec((_tie) => ({})),
).toEqualTypeOf<{}>();
// Empty "letrec" with types manually defined
expectTypeOf(
  fc.letrec<{}>((_tie) => ({})),
).toEqualTypeOf<{}>();
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>()(
  fc.letrec((_tie) => ({
    a: fc.nat(),
    b: fc.string(),
  })),
  'No recursion "letrec"',
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>()(
  fc.letrec<{ a: number; b: string }>((_tie) => ({
    a: fc.nat(),
    b: fc.string(),
  })),
  'No recursion "letrec" with types manually defined',
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  })),
  'Recursive "letrec"',
); // TODO Typings should be improved: b type might be infered from a
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<number> }>()(
  fc.letrec<{ a: number; b: number }>((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  })),
  'Recursive "letrec" with types manually defined',
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  })),
  'Invalid recursion "letrec"',
); // TODO Typings should be improved: referencing an undefined key should failed
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec<{ a: number; b: unknown }>((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  })),
  'Invalid recursion "letrec" with types manually defined',
); // TODO Even when fully typed we accept undeclared keys from being used on tie (see why PR-2968)
expectType<{ a: fc.Arbitrary<number> }>()(
  fc.letrec<{ a: number }>((_tie) => ({
    a: fc.nat(),
    b: fc.nat(),
  })),
  'Accept additional keys within "letrec" but do not expose them outside',
);
fc.letrec<{ a: string }>((_tie) => ({
  // @ts-expect-error - reject builders implying 'wrongly typed keys' when type declared
  a: fc.nat(),
}));

// clone arbitrary
expectType<fc.Arbitrary<[]>>()(fc.clone(fc.nat(), 0), '"clone" 0-time');
expectType<fc.Arbitrary<[number]>>()(fc.clone(fc.nat(), 1), '"clone" 1-time');
expectType<fc.Arbitrary<[number, number]>>()(fc.clone(fc.nat(), 2), '"clone" 2-times');
expectType<fc.Arbitrary<[number, number, number]>>()(fc.clone(fc.nat(), 3), '"clone" 3-times');
expectType<fc.Arbitrary<[number, number, number, number]>>()(fc.clone(fc.nat(), 4), '"clone" 4-times');
expectType<fc.Arbitrary<[number, number, number, number, number]>>()(fc.clone(fc.nat(), 5), '"clone" 5-times');
declare const nTimesClone: number;
expectType<fc.Arbitrary<number[]>>()(fc.clone(fc.nat(), nTimesClone), '"clone" with non-precise number of times');

// func arbitrary
expectType<fc.Arbitrary<() => number>>()(fc.func(fc.nat()), '"func" producing "nat"');
// @ts-expect-error - func expects arbitraries not raw values
fc.func(1);

// falsy arbitary
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy(),
  'falsy" without any constraints',
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy({}),
  'falsy" with empty constraints',
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy({ withBigInt: false }),
  'falsy" with withBigInt=false',
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined | 0n>>()(
  fc.falsy({ withBigInt: true }),
  'falsy" with withBigInt=true',
);

// configureGlobal
// "configureGlobal" with custom reporter
expectTypeOf(
  fc.configureGlobal({ reporter: (_out: fc.RunDetails<unknown>) => {} }),
).toEqualTypeOf<void>();
// FIXME // @ts-expect-error - reporter cannot be defined with precise type on configureGlobal
//fc.configureGlobal({ reporter: (out: fc.RunDetails<[number]>) => {} });

// entityGraph
type Node = { name: string; linkTo: Node[] };
expectType<fc.Arbitrary<{ node: Node[] }>>()(
  fc.entityGraph(
    { node: { name: fc.string() } },
    { node: { linkTo: { arity: 'many', type: 'node' } } },
    { unicityConstraints: { node: (n) => n.name } },
  ),
  'translate "many" into an array',
);
type Employee = { firstName: string; lastName: string; manager: Employee | undefined };
expectType<fc.Arbitrary<{ employee: Employee[] }>>()(
  fc.entityGraph(
    { employee: { firstName: fc.string(), lastName: fc.string() } },
    { employee: { manager: { arity: '0-1', type: 'employee', strategy: 'successor' } } },
  ),
  'translate "0-1" into a defined value or undefined',
);
type Profile = { id: string };
type User = { userName: string; profile: Profile };
expectType<fc.Arbitrary<{ profile: Profile[]; user: User[] }>>()(
  fc.entityGraph(
    { user: { userName: fc.string() }, profile: { id: fc.uuid() } },
    { user: { profile: { arity: '1', type: 'profile', strategy: 'exclusive' } }, profile: {} },
    {
      unicityConstraints: {
        user: (u) => {
          expectType<Omit<User, 'profile'>>()(u, 'non-relational part of an User');
          return u.userName;
        },
        profile: (p) => {
          // non-relational part of a Profile
expectTypeOf(p).toEqualTypeOf<Profile>();
          return p.id;
        },
      },
    },
  ),
  'translate "1" into a defined value',
);
fc.entityGraph(
  { user: { userName: fc.string() }, profile: { id: fc.uuid() } },
  // @ts-expect-error - Expect all entities to be declared for relations
  { user: { profile: { arity: '1', type: 'profile', strategy: 'exclusive' } } },
  { unicityConstraints: { user: (u) => u.userName, profile: (p) => p.id } },
);
fc.entityGraph(
  { user: { userName: fc.string() }, profile: { id: fc.uuid() } },
  {
    user: {
      profile: {
        arity: '1',
        // @ts-expect-error - Expect type to refer to an entity being declared
        type: 'profil€',
        strategy: 'exclusive',
      },
    },
    profile: {},
  },
  { unicityConstraints: { user: (u) => u.userName, profile: (p) => p.id } },
);
