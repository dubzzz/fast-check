// Just a simple property, compiling a snippet importing fast-check
// should be enough to ensure that typings will not raise errors regarding incompatible
// and unknown syntaxes at build time

/* eslint-disable @typescript-eslint/no-unused-vars */
import fc from 'fast-check';
import { expectType, expectTypeAssignable } from './type-checker';

// assert
expectType<void>()(fc.assert(fc.property(fc.nat(), () => {})));
expectType<Promise<void>>()(fc.assert(fc.asyncProperty(fc.nat(), async () => {})));

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
  )
);
// prettier-ignore
// @ts-expect-error - Reporter must be compatible with generated values
fc.assert(fc.property(fc.nat(), () => {}), { reporter: (out: fc.RunDetails<[string, string]>) => {} });

// property
expectTypeAssignable<fc.IProperty<[number]>>()(fc.property(fc.nat(), (a) => {}));
expectTypeAssignable<fc.IProperty<[number, string]>>()(fc.property(fc.nat(), fc.string(), (a, b) => {}));
expectType<void>()(
  fc.assert(
    fc
      .property(fc.nat(), () => {})
      .beforeEach(() => 123)
      .afterEach(() => 'anything')
  )
);
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.property(fc.nat(), fc.string(), (a: number, b: number) => {});

// asyncProperty
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(fc.asyncProperty(fc.nat(), async (a) => {}));
expectTypeAssignable<fc.IAsyncProperty<[number, string]>>()(
  fc.asyncProperty(fc.nat(), fc.string(), async (a, b) => {})
);
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(async () => 123)
    .afterEach(async () => 'anything')
);
expectTypeAssignable<fc.IAsyncProperty<[number]>>()(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(() => 123)
    .afterEach(() => 'anything')
);
// @ts-expect-error - Types declared in predicate are not compatible with the generators
fc.asyncProperty(fc.nat(), fc.string(), async (a: number, b: number) => {});

// ArbitraryWithContextualShrink
expectTypeAssignable<fc.Arbitrary<number>>()(fc.nat());
expectTypeAssignable<fc.ArbitraryWithShrink<number>>()(fc.nat());
expectTypeAssignable<fc.ArbitraryWithContextualShrink<number>>()(fc.nat());

// base arbitrary
expectType<fc.Arbitrary<string[]>>()(fc.nat().chain((n) => fc.array(fc.char(), { maxLength: n })));
expectType<fc.Arbitrary<number>>()(fc.option(fc.nat()).filter((n): n is number => n !== null));
expectType<fc.Arbitrary<string>>()(fc.nat().map((n) => String(n)));

// constantFrom arbitrary
expectType<fc.Arbitrary<number>>()(fc.constantFrom(1, 2));
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<1 | 2>>()(fc.constantFrom(...([1, 2] as const)));
expectType<fc.Arbitrary<number | string>>()(fc.constantFrom(1, 2, 'hello'));
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<1 | 2 | 'hello'>>()(fc.constantFrom(...([1, 2, 'hello'] as const)));

// record arbitrary
const mySymbol1 = Symbol('symbol1');
const mySymbol2 = Symbol('symbol2');
expectType<fc.Arbitrary<{ a: number; b: string }>>()(fc.record({ a: fc.nat(), b: fc.string() }));
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]: string }>>()(
  fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() })
);
// Related to https://github.com/microsoft/TypeScript/issues/27525:
//expectType<fc.Arbitrary<{ [Symbol.iterator]: number; [mySymbol2]: string }>>()(
//  fc.record({ [Symbol.iterator]: fc.nat(), [mySymbol2]: fc.string() })
//);
// Workaround for known symbols not defined as unique ones:
//const symbolIterator: unique symbol = Symbol.iterator as any;
//expectType<fc.Arbitrary<{ [symbolIterator]: number; [mySymbol2]: string }>>()(
//  fc.record({ [symbolIterator]: fc.nat(), [mySymbol2]: fc.string() })
//);
expectType<fc.Arbitrary<{ a: number; b: string }>>()(fc.record({ a: fc.nat(), b: fc.string() }, {}));
expectType<fc.Arbitrary<{ a: number; b: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: false })
);
expectType<fc.Arbitrary<{ a?: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: true })
);
expectType<fc.Arbitrary<{ a?: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: [] })
);
expectType<fc.Arbitrary<{ a: number; b?: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['a'] })
);
expectType<fc.Arbitrary<{ a: number; b?: string; c: string }>>()(
  fc.record({ a: fc.nat(), b: fc.string(), c: fc.string() }, { requiredKeys: ['a', 'c'] })
);
expectType<fc.Arbitrary<{ [mySymbol1]: number; [mySymbol2]?: string }>>()(
  fc.record({ [mySymbol1]: fc.nat(), [mySymbol2]: fc.string() }, { requiredKeys: [mySymbol1] as [typeof mySymbol1] })
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
  )
);
expectType<fc.Arbitrary<never>>()(
  // requiredKeys and withDeletedKeys cannot be used together
  // typings are not perfect but at least they build a value that cannot be used
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: true, requiredKeys: [] })
);
// @ts-expect-error - requiredKeys references an unknown key
fc.record({ a: fc.nat(), b: fc.string() }, { requiredKeys: ['c'] });
// @ts-expect-error - record expects arbitraries not raw values
fc.record({ a: 1 });

// dictionary arbitrary
expectType<fc.Arbitrary<Record<string, number>>>()(fc.dictionary(fc.string(), fc.nat()));
expectType<fc.Arbitrary<Record<string, number>>>()(fc.dictionary(fc.constant('1'), fc.nat()));
// @ts-expect-error - dictionary expects arbitraries producing strings for keys
fc.dictionary(fc.nat(), fc.nat());

// tuple arbitrary
expectType<fc.Arbitrary<[number]>>()(fc.tuple(fc.nat()));
expectType<fc.Arbitrary<[number, string]>>()(fc.tuple(fc.nat(), fc.string()));
// @ts-expect-error - tuple expects arbitraries not raw values
fc.tuple(fc.nat(), '');

// oneof arbitrary
expectType<fc.Arbitrary<string>>()(fc.oneof(fc.string(), fc.fullUnicodeString()));
expectType<fc.Arbitrary<string | number>>()(fc.oneof(fc.string(), fc.nat()));
// @ts-expect-error - oneof expects arbitraries not raw values
fc.oneof(fc.string(), '1');

// frequency arbitrary
expectType<fc.Arbitrary<string>>()(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.fullUnicodeString(), weight: 1 })
);
expectType<fc.Arbitrary<number | string>>()(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 })
);
// @ts-expect-error - frequency expects arbitraries not raw values
fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: '1', weight: 1 });

// option arbitrary
expectType<fc.Arbitrary<number | null>>()(fc.option(fc.nat()));
expectType<fc.Arbitrary<number | null>>()(fc.option(fc.nat(), { nil: null }));
// @fc-ignore-if-no-const
expectType<fc.Arbitrary<number | 'custom_default'>>()(fc.option(fc.nat(), { nil: 'custom_default' as const }));
// @ts-expect-error - option expects arbitraries not raw values
fc.option(1);

// tie arbitrary
// eslint-disable-next-line @typescript-eslint/ban-types
expectType<{}>()(fc.letrec((tie) => ({})));
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: fc.string(),
  }))
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  }))
); // TODO Typings should be improved: b type might be infered from a
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>()(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  }))
); // TODO Typings should be improved: referencing an undefined key should failed

// clone arbitrary
expectType<fc.Arbitrary<[]>>()(fc.clone(fc.nat(), 0));
expectType<fc.Arbitrary<[number]>>()(fc.clone(fc.nat(), 1));
expectType<fc.Arbitrary<[number, number]>>()(fc.clone(fc.nat(), 2));
expectType<fc.Arbitrary<[number, number, number]>>()(fc.clone(fc.nat(), 3));
expectType<fc.Arbitrary<[number, number, number, number]>>()(fc.clone(fc.nat(), 4));
expectType<fc.Arbitrary<number[]>>()(fc.clone(fc.nat(), 5)); // TODO Typings should be improved: handle any number of values

// func arbitrary
expectType<fc.Arbitrary<() => number>>()(fc.func(fc.nat()));
// @ts-expect-error - func expects arbitraries not raw values
fc.func(1);

// falsy arbitary
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(fc.falsy());
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(fc.falsy({}));
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined>>()(fc.falsy({ withBigInt: false }));
expectType<fc.Arbitrary<false | null | 0 | '' | typeof NaN | undefined | 0n>>()(fc.falsy({ withBigInt: true }));

// configureGlobal
expectType<void>()(fc.configureGlobal({ reporter: (out: fc.RunDetails<unknown>) => {} }));
// FIXME // @ts-expect-error - reporter cannot be defined with precise type on configureGlobal
//fc.configureGlobal({ reporter: (out: fc.RunDetails<[number]>) => {} });
