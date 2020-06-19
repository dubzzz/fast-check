import { expectType, expectError } from 'tsd';
import * as fc from 'fast-check';

// assert
expectType<void>(fc.assert(fc.property(fc.nat(), () => {})));
expectType<Promise<void>>(fc.assert(fc.asyncProperty(fc.nat(), async () => {})));

// assert (beforeEach, afterEach)
expectError(fc.assert(fc.property(fc.nat(), () => {}).beforeEach(async () => {})));
expectError(fc.assert(fc.property(fc.nat(), () => {}).afterEach(async () => {})));

// assert (reporter)
expectType(
  fc.assert(
    fc.property(fc.nat(), fc.string(), () => {}),
    {
      reporter: (out: fc.RunDetails<[number, string]>) => {},
    }
  )
);
expectError(
  fc.assert(
    fc.property(fc.nat(), () => {}),
    {
      reporter: (out: fc.RunDetails<[string, string]>) => {},
    }
  )
);

// property
expectType(fc.property(fc.nat(), (a) => {}) as fc.IProperty<[number]>);
expectType(fc.property(fc.nat(), fc.string(), (a, b) => {}) as fc.IProperty<[number, string]>);
expectType(
  fc.assert(
    fc
      .property(fc.nat(), () => {})
      .beforeEach(() => 123)
      .afterEach(() => 'anything')
  )
);
expectError(fc.property(fc.nat(), fc.string(), (a: number, b: number) => {}));

// asyncProperty
expectType(fc.asyncProperty(fc.nat(), async (a) => {}) as fc.IAsyncProperty<[number]>);
expectType(fc.asyncProperty(fc.nat(), fc.string(), async (a, b) => {}) as fc.IAsyncProperty<[number, string]>);
expectType(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(async () => 123)
    .afterEach(async () => 'anything')
);
expectType(
  fc
    .asyncProperty(fc.nat(), async () => {})
    .beforeEach(() => 123)
    .afterEach(() => 'anything')
);
expectError(fc.asyncProperty(fc.nat(), fc.string(), async (a: number, b: number) => {}));

// base arbitrary
expectType<fc.Arbitrary<string[]>>(fc.nat().chain((n) => fc.array(fc.char(), 0, n)));
expectType<fc.Arbitrary<number>>(fc.option(fc.nat()).filter((n): n is number => n !== null));
expectType<fc.Arbitrary<string>>(fc.nat().map((n) => String(n)));

// constantFrom arbitrary
expectType<fc.Arbitrary<number>>(fc.constantFrom(1, 2));
expectType<fc.Arbitrary<1 | 2>>(fc.constantFrom(...([1, 2] as const)));
expectType<fc.Arbitrary<number | string>>(fc.constantFrom(1, 2, 'hello'));
expectType<fc.Arbitrary<1 | 2 | 'hello'>>(fc.constantFrom(...([1, 2, 'hello'] as const)));

// record arbitrary
expectType<fc.Arbitrary<{ a: number; b: string }>>(fc.record({ a: fc.nat(), b: fc.string() }));
expectType<fc.Arbitrary<{ a?: number; b?: string }>>(
  fc.record({ a: fc.nat(), b: fc.string() }, { withDeletedKeys: true })
);
expectError(fc.record({ a: 1 }));

// dictionary arbitrary
expectType<fc.Arbitrary<Record<string, number>>>(fc.dictionary(fc.string(), fc.nat()));
expectError(fc.dictionary(fc.nat(), fc.nat()));

// tuple arbitrary
expectType<fc.Arbitrary<[number]>>(fc.tuple(fc.nat()));
expectType<fc.Arbitrary<[number, string]>>(fc.tuple(fc.nat(), fc.string()));
expectError(fc.tuple(fc.nat(), ''));

// oneof arbitrary
expectType<fc.Arbitrary<string>>(fc.oneof(fc.string(), fc.fullUnicodeString()));
expectType<fc.Arbitrary<string | number>>(fc.oneof(fc.string(), fc.nat()));
expectError(fc.oneof(fc.string(), '1'));

// frequency arbitrary
expectType<fc.Arbitrary<string>>(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.fullUnicodeString(), weight: 1 })
);
expectType<fc.Arbitrary<number | string>>(
  fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: fc.nat(), weight: 1 })
);
expectError(fc.frequency({ arbitrary: fc.string(), weight: 1 }, { arbitrary: '1', weight: 1 }));

// option arbitrary
expectType<fc.Arbitrary<number | null>>(fc.option(fc.nat()));
expectType<fc.Arbitrary<number | null>>(fc.option(fc.nat(), { nil: null }));
expectType<fc.Arbitrary<number | 'custom_default'>>(fc.option(fc.nat(), { nil: 'custom_default' as const }));
expectError(fc.option(1));

// tie arbitrary
expectType<{}>(fc.letrec((tie) => ({})));
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<string> }>(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: fc.string(),
  }))
);
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('a'),
  }))
); // TODO Typings should be improved: b type might be infered from a
expectType<{ a: fc.Arbitrary<number>; b: fc.Arbitrary<unknown> }>(
  fc.letrec((tie) => ({
    a: fc.nat(),
    b: tie('c'),
  }))
); // TODO Typings should be improved: referencing an undefined key should failed

// dedup arbitrary
expectType<fc.Arbitrary<[]>>(fc.dedup(fc.nat(), 0));
expectType<fc.Arbitrary<[number]>>(fc.dedup(fc.nat(), 1));
expectType<fc.Arbitrary<[number, number]>>(fc.dedup(fc.nat(), 2));
expectType<fc.Arbitrary<[number, number, number]>>(fc.dedup(fc.nat(), 3));
expectType<fc.Arbitrary<[number, number, number, number]>>(fc.dedup(fc.nat(), 4));
expectType<fc.Arbitrary<number[]>>(fc.dedup(fc.nat(), 5)); // TODO Typings should be improved: handle any number of values

// func arbitrary
expectType<fc.Arbitrary<() => number>>(fc.func(fc.nat()));
expectError(fc.func(1));

// configureGlobal
expectType(fc.configureGlobal({ reporter: (out: fc.RunDetails<unknown>) => {} }));
expectError(fc.configureGlobal({ reporter: (out: fc.RunDetails<[number]>) => {} }));
