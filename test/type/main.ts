// Just a simple property, compiling a snippet importing fast-check
// should be enough to ensure that typings will not raise errors regarding incompatible
// and unknown syntaxes at build time

/* eslint-disable @typescript-eslint/no-unused-vars */
import fc from 'fast-check';
import { expectType, expectTypeAssignable } from './type-checker';

// assert
expectType<void>()(fc.assert(fc.property(fc.nat(), () => {})), 'Synchronous property means synchronous assert');
expectType<Promise<void>>()(
  fc.assert(fc.asyncProperty(fc.nat(), async () => {})),
  'Asynchronous property means asynchronous assert'
);

// assert (beforeEach, afterEach)
// @ts-expect-error - Synchronous properties do not accept asynchronous beforeEach
fc.assert(fc.property(fc.nat(), () => {}).beforeEach(async () => {}));
// @ts-expect-error - Synchronous properties do not accept asynchronous afterEach
fc.assert(fc.property(fc.nat(), () => {}).afterEach(async () => {}));

// assert (reporter)
expectType<void>()(
  fc.assert(
    fc.property(fc.nat(), fc.string(), () => {}),
    { reporter: (out: fc.RunDetails<[number, string]>) => {} }
  ),
  'Accept a reporter featuring the right types'
);
// prettier-ignore
// @ts-expect-error - Reporter must be compatible with generated values
fc.assert(fc.property(fc.nat(), () => {}), { reporter: (out: fc.RunDetails<[string, string]>) => {} });

// property
expectTypeAssignable<fc.IProperty<[number]>>()(
  fc.property(fc.nat(), (a) => {}),
  '"property" instanciates instances compatible with IProperty'
);
expectTypeAssignable<fc.IProperty<[number, string]>>()(
  fc.property(fc.nat(), fc.string(), (a, b) => {}),
  '"property" handles tuples'
);
expectType<void>()(
  fc.assert(
    fc
      .property(fc.nat(), () => {})
      .beforeEach(() => 123)
      .afterEach(() => 'anything')
  ),
  'Synchronous property accepts synchronous hooks'
);
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.property(fc.nat(), fc.string(), (a: number, b: number) => {});

// asyncProperty
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(
  fc.asyncProperty(fc.nat(), async (a) => {}),
  '"asyncProperty" instanciates instances compatible with IAsyncProperty'
);
expectTypeAssignable<fc.IAsyncProperty<[number, string]>>()(
  fc.asyncProperty(fc.nat(), fc.string(), async (a, b) => {}),
  '"asyncProperty" handles tuples'
);
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(async () => 123)
    .afterEach(async () => 'anything'),
  'Asynchronous property accepts asynchronous hooks'
);
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(() => 123)
    .afterEach(() => 'anything'),
  'Asynchronous property accepts synchronous hooks'
);
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.asyncProperty(fc.nat(), fc.string(), async (a: number, b: number) => {});

// ArbitraryWithContextualShrink
expectTypeAssignable<fc.Arbitrary<number>>()(
  (null as any) as fc.ArbitraryWithShrink<number>,
  'ArbitraryWithShrink<number> implements Arbitrary<number>'
);
expectTypeAssignable<fc.Arbitrary<number>>()(
  (null as any) as fc.ArbitraryWithContextualShrink<number>,
  'ArbitraryWithContextualShrink<number> implements Arbitrary<number>'
);
expectTypeAssignable<fc.ArbitraryWithShrink<number>>()(
  (null as any) as fc.ArbitraryWithContextualShrink<number>,
  'ArbitraryWithContextualShrink<number> implements ArbitraryWithShrink<number>'
);
expectTypeAssignable<fc.ArbitraryWithContextualShrink<number>>()(
  fc.nat(),
  '"nat" implements ArbitraryWithContextualShrink<number>'
);

// base arbitrary (chain)
expectType<fc.Arbitrary<string[]>>()(
  fc.nat().chain((n) => fc.array(fc.char(), { maxLength: n })),
  'Type of "chain" corresponds to the return type of the passed lambda'
);
expectType<fc.Arbitrary<number>>()(
  fc.constantFrom(1, 2, 3).chain((value) => fc.constant(value)),
  'Type of "chain" corresponds to the return type of the passed lambda'
);
expectType<fc.Arbitrary<1 | 2 | 3>>()(
  // without the as, TypeScript refused to compile as constantFrom requires t least one argument
  fc.constantFrom(...([1, 2, 3] as [1, 2, 3])).chain((value) => fc.constant(value)),
  'Type of "chain" should not simplify the type to something more general (no "1 -> number" expected)'
);

// base arbitrary (filter)
expectType<fc.Arbitrary<number>>()(
  fc.option(fc.nat()).filter((n): n is number => n !== null),
  '"filter" preserves the source type'
);

// base arbitrary (map)
expectType<fc.Arbitrary<string>>()(
  fc.nat().map((n) => String(n)),
  '"map" alters the resulting type'
);

// constantFrom arbitrary
expectType<fc.Arbitrary<number>>()(
  fc.constantFrom(1, 2),
  'By default, "constantFrom" simplifies the type (eg.: "1 -> number")'
);
// prettier-ignore
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<1 | 2>>()(fc.constantFrom(...([1, 2] as const)), '"as const" prevent extra simplification of "constantFrom"');
// prettier-ignore-end
expectType<fc.Arbitrary<number | string>>()(
  fc.constantFrom(1, 2, 'hello'),
  '"constantFrom" accepts arguments not having the same types without any typing trick'
);
// prettier-ignore
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<1 | 2 | 'hello'>>()(fc.constantFrom(...([1, 2, 'hello'] as const)), '"as const" prevent extra simplification of "constantFrom"');
// prettier-ignore-end

// record arbitrary
const mySymbol1 = Symbol('symbol1');
const mySymbol2 = Symbol('symbol2');
expectType<fc.Arbitrary<{ a: number; b: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }),
  '"record" can contain multiple types'
);
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]: string }>>()(
  fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() }),
  '"record" can be indexed using unique symbols as keys'
);
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
expectType<fc.Arbitrary<{ a: number; b: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, {}),
  '"record" accepts empty constraints'
);
expectType<fc.Arbitrary<{ a: number; b: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: false }),
  '"record" understands withDeletedKeys=false'
);
expectType<fc.Arbitrary<{ a?: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: true }),
  '"record" understands withDeletedKeys=true'
);
expectType<fc.Arbitrary<{ a?: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] }),
  '"record" only applies optional on keys declared within requiredKeys even when empty'
);
expectType<fc.Arbitrary<{ a: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['a'] }),
  '"record" only applies optional on keys declared within requiredKeys even if unique'
);
expectType<fc.Arbitrary<{ a: number; b?: string; c: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string(), c: fc.string() }, { requiredKeys: ['a', 'c'] }),
  '"record" only applies optional on keys declared within requiredKeys even if multiple ones specified'
);
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string }>>()(
  fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [mySymbol1] as [typeof mySymbol1] }),
  '"record" only applies optional on keys declared within requiredKeys even if it contains symbols'
);
// Related to https://github.com/microsoft/TypeScript/issues/27525
//expectType<fc.Arbitrary<{ [Symbol.iterator]: number; [mySymbol2]?: string }>>()(
//  fc.record({ [Symbol.iterator]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [Symbol.iterator] })
//);
// See workaround above
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string; a: number; b?: string }>>()(
  fc.record(
    { [mySymbol1]: fc.nat(), [mySymbol2]: fc.string(), a: fc.nat(), b: fc.string() },
    { requiredKeys: [mySymbol1, 'a'] as [typeof mySymbol1, 'a'] }
  ),
  '"record" only applies optional on keys declared within requiredKeys even if it contains symbols and normal keys'
);
expectType<fc.Arbitrary<never>>()(
  // requiredKeys and withDeletedKeys cannot be used together
  // typings are not perfect but at least they build a value that cannot be used
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: true, requiredKeys: [] }),
  '"record" receiving both withDeletedKeys and requiredKeys is invalid'
);
// @ts-expect-error - requiredKeys references an unknown key
fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['c'] });
// @ts-expect-error - record expects arbitraries not raw values
fc.record({ a: 1 });

// dictionary arbitrary
expectType<fc.Arbitrary<Record<string, number>>>()(fc.dictionary(fc.string(), fc.nat()), 'Basic call to "dictionary"');
// @ts-expect-error - dictionary expects arbitraries producing strings for keys
fc.dictionary(fc.nat(), fc.nat());

// tuple arbitrary
expectType<fc.Arbitrary<[number]>>()(fc.tuple(fc.nat()), '"tuple" with a single argument');
expectType<fc.Arbitrary<[number, string]>>()(fc.tuple(fc.nat(), fc.string()), '"tuple" with a multiple arguments');
// @ts-expect-error - tuple expects arbitraries not raw values
fc.tuple(fc.nat(), '');

// oneof arbitrary
expectType<fc.Arbitrary<string>>()(
  fc.oneof(fc.string(), fc.fullUnicodeString()),
  '"oneof" with a multiple arguments having the same type'
);
expectType<fc.Arbitrary<string | number>>()(
  fc.oneof(fc.string(), fc.nat()),
  '"oneof" with a multiple arguments of different types'
);
// @ts-expect-error - oneof expects arbitraries not raw values
fc.oneof(fc.string(), '1');

// frequency arbitrary
expectType<fc.Arbitrary<string>>()(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.fullUnicodeString(), weight: 1 }),
  '"frequency" with a multiple arguments having the same type'
);
expectType<fc.Arbitrary<number | string>>()(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 }),
  '"frequency" with a multiple arguments of different types'
);
// @ts-expect-error - frequency expects arbitraries not raw values
fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: '1', weight: 1 });

// option arbitrary
expectType<fc.Arbitrary<number | null>>()(fc.option(fc.nat()), '"option" without any constraints');
expectType<fc.Arbitrary<number | null>>()(
  fc.option(fc.nat(), { nil: null }),
  '"option" with nil overriden to null (the original default)'
);
// prettier-ignore
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<number | 'custom_default'>>()(fc.option(fc.nat(), { nil: 'custom_default' as const }), '"option" with nil overriden to custom value');
// prettier-ignore-end
// @ts-expect-error - option expects arbitraries not raw values
fc.option(1);

// tie arbitrary
// eslint-disable-next-line @typescript-eslint/ban-types
expectType<{}>()(
  fc.letrec((tie) => ({})),
  'Empty "letrec"'
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: fc.string(),
  })),
  'No recursion "letrec"'
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  })),
  'Recursive "letrec"'
); // TODO Typings should be improved: b type might be infered from a
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  })),
  'Invalid recursion "letrec"'
); // TODO Typings should be improved: referencing an undefined key should failed

// clone arbitrary
expectType<fc.Arbitrary<[]>>()(fc.clone(fc.nat(), 0), '"clone" 0-time');
expectType<fc.Arbitrary<[number]>>()(fc.clone(fc.nat(), 1), '"clone" 1-time');
expectType<fc.Arbitrary<[number, number]>>()(fc.clone(fc.nat(), 2), '"clone" 2-times');
expectType<fc.Arbitrary<[number, number, number]>>()(fc.clone(fc.nat(), 3), '"clone" 3-times');
expectType<fc.Arbitrary<[number, number, number, number]>>()(fc.clone(fc.nat(), 4), '"clone" 4-times');
expectType<fc.Arbitrary<number[]>>()(fc.clone(fc.nat(), 5), '"clone" 5-times or above'); // TODO Typings should be improved: handle any number of values

// func arbitrary
expectType<fc.Arbitrary<() => number>>()(fc.func(fc.nat()), '"func" producing "nat"');
// @ts-expect-error - func expects arbitraries not raw values
fc.func(1);

// falsy arbitary
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy(),
  'falsy" without any constraints'
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy({}),
  'falsy" with empty constraints'
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(
  fc.falsy({ withBigInt: false }),
  'falsy" with withBigInt=false'
);
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined | 0n>>()(
  fc.falsy({ withBigInt: true }),
  'falsy" with withBigInt=true'
);

// configureGlobal
expectType<void>()(
  fc.configureGlobal({ reporter: (out: fc.RunDetails<unknown>) => {} }),
  '"configureGlobal" with custom reporter'
);
// FIXME // @ts-expect-error - reporter cannot be defined with precise type on configureGlobal
//fc.configureGlobal({ reporter: (out: fc.RunDetails<[number]>) => {} });
