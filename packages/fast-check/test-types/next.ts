import * as main from 'fast-check';
import * as fc from 'fast-check/next';
import { expectTypeOf } from 'vitest';

expectTypeOf(fc.property).toEqualTypeOf<typeof main.asyncProperty>();
expectTypeOf(fc.asyncProperty).toEqualTypeOf<typeof main.asyncProperty>();
expectTypeOf(fc.nat()).toEqualTypeOf<fc.Arbitrary<number>>();

// Both synchronous and asynchronous predicates produce asynchronous properties.
expectTypeOf(fc.property(fc.nat(), (_n) => {})).toEqualTypeOf<fc.IAsyncPropertyWithHooks<[number]>>();
expectTypeOf(fc.property(fc.nat(), fc.string(), async (_n, _s) => {})).toEqualTypeOf<
  fc.IAsyncPropertyWithHooks<[number, string]>
>();
expectTypeOf(fc.assert(fc.property(fc.nat(), () => true))).toEqualTypeOf<Promise<void>>();
expectTypeOf(fc.assert(fc.property(fc.nat(), async () => true))).toEqualTypeOf<Promise<void>>();
expectTypeOf(fc.check(fc.property(fc.nat(), async (_n) => true))).toEqualTypeOf<Promise<fc.RunDetails<[number]>>>();

// Asynchronous hooks are available through the property alias.
expectTypeOf(
  fc
    .property(fc.nat(), async (_n) => {})
    .beforeEach(async () => {})
    .afterEach(async () => {}),
).toEqualTypeOf<fc.IAsyncPropertyWithHooks<[number]>>();

// @ts-expect-error - The predicate must accept the generated types.
fc.property(fc.nat(), fc.string(), async (_n: number, _s: number) => {});
// @ts-expect-error - The predicate must declare all generated values.
fc.property(fc.nat(), fc.string(), async (_n: number) => {});

// The main entry point keeps its synchronous property and assertion types.
expectTypeOf(main.assert(main.property(main.nat(), () => true))).toEqualTypeOf<void>();
