import * as fc from 'fast-check';
import { expectTypeOf } from 'vitest';

// Readonly inputs must preserve literal inference and mutable generated arrays.
const nobleGasNames = ['helium', 'neon', 'argon', 'krypton', 'xenon', 'radon'] as const;
type NobleGasName = (typeof nobleGasNames)[number];
expectTypeOf(fc.subarray(nobleGasNames)).toEqualTypeOf<fc.Arbitrary<NobleGasName[]>>();
expectTypeOf(fc.shuffledSubarray(nobleGasNames)).toEqualTypeOf<fc.Arbitrary<NobleGasName[]>>();
declare const readonlyNames: readonly string[];
declare const mutableNames: string[];
expectTypeOf(fc.subarray(readonlyNames)).toEqualTypeOf<fc.Arbitrary<string[]>>();
expectTypeOf(fc.shuffledSubarray(readonlyNames)).toEqualTypeOf<fc.Arbitrary<string[]>>();
expectTypeOf(fc.subarray(mutableNames)).toEqualTypeOf<fc.Arbitrary<string[]>>();
expectTypeOf(fc.shuffledSubarray(mutableNames)).toEqualTypeOf<fc.Arbitrary<string[]>>();
const empty = [] as const;
expectTypeOf(fc.subarray(empty)).toEqualTypeOf<fc.Arbitrary<never[]>>();
expectTypeOf(fc.shuffledSubarray(empty)).toEqualTypeOf<fc.Arbitrary<never[]>>();
const objects = [{ name: 'helium' }] as const;
expectTypeOf(fc.subarray(objects)).toEqualTypeOf<fc.Arbitrary<{ readonly name: 'helium' }[]>>();

// Both command overloads, including asynchronous checks, accept readonly lists.
type Model = { count: number };
type Real = { value: number };
declare const syncCommands: readonly fc.Arbitrary<fc.Command<Model, Real>>[];
declare const asyncCommands: readonly fc.Arbitrary<fc.AsyncCommand<Model, Real>>[];
declare const asyncCheckCommands: readonly fc.Arbitrary<fc.AsyncCommand<Model, Real, true>>[];
expectTypeOf(fc.commands(syncCommands)).toEqualTypeOf<fc.Arbitrary<Iterable<fc.Command<Model, Real>>>>();
expectTypeOf(fc.commands(asyncCommands)).toEqualTypeOf<fc.Arbitrary<Iterable<fc.AsyncCommand<Model, Real>>>>();
expectTypeOf(fc.commands(asyncCheckCommands)).toEqualTypeOf<
  fc.Arbitrary<Iterable<fc.AsyncCommand<Model, Real, true>>>
>();
const invalidCommands = [fc.nat()] as const;
// @ts-expect-error - Commands must still implement the command interface
fc.commands(invalidCommands);

// Readonly required keys keep the exact required/optional fields, including symbols.
const requiredKeys = ['name'] as const;
expectTypeOf(fc.record({ name: fc.string(), count: fc.nat() }, { requiredKeys })).toEqualTypeOf<
  fc.Arbitrary<{ name: string; count?: number }>
>();
expectTypeOf(fc.record({ name: fc.string(), count: fc.nat() }, { requiredKeys: empty })).toEqualTypeOf<
  fc.Arbitrary<{ name?: string; count?: number }>
>();
declare const requiredSymbol: unique symbol;
const requiredSymbolKeys = [requiredSymbol, 'name'] as const;
expectTypeOf(
  fc.record(
    { [requiredSymbol]: fc.boolean(), name: fc.string(), count: fc.nat() },
    { requiredKeys: requiredSymbolKeys },
  ),
).toEqualTypeOf<fc.Arbitrary<{ [requiredSymbol]: boolean; name: string; count?: number }>>();
const invalidKeys = ['missing'] as const;
// @ts-expect-error - Readonly required keys cannot reference unknown keys
fc.record({ name: fc.string() }, { requiredKeys: invalidKeys });

const values = [fc.string(), fc.nat()] as const;
expectTypeOf<fc.OneOfValue<typeof values>>().toEqualTypeOf<string | number>();
const weightedValues = [{ arbitrary: fc.string(), weight: 1 }, fc.nat()] as const;
expectTypeOf<fc.OneOfValue<typeof weightedValues>>().toEqualTypeOf<string | number>();
expectTypeOf(fc.anything({ values })).toEqualTypeOf<fc.Arbitrary<unknown>>();
expectTypeOf(fc.object({ values })).toEqualTypeOf<fc.Arbitrary<Record<string, unknown>>>();
const validSchemes = ['https', 'ftp'] as const;
expectTypeOf(fc.webUrl({ validSchemes })).toEqualTypeOf<fc.Arbitrary<string>>();
const versions = [4, 7] as const;
expectTypeOf(fc.uuid({ version: versions })).toEqualTypeOf<fc.Arbitrary<string>>();
const invalidVersions = [0, 16] as const;
// @ts-expect-error - Readonly UUID versions must still be in the supported range
fc.uuid({ version: invalidVersions });

const ordering = [2, 1] as const;
expectTypeOf(fc.schedulerFor(ordering)).toEqualTypeOf<fc.Scheduler<unknown>>();
expectTypeOf(fc.schedulerFor<string>(ordering, { act: (f) => f() })).toEqualTypeOf<fc.Scheduler<string>>();
const sequence = [
  () => Promise.resolve('first'),
  { builder: () => Promise.resolve('second'), label: 'second' },
] as const;
expectTypeOf(fc.schedulerFor(ordering).scheduleSequence(sequence)).toEqualTypeOf<{
  readonly done: boolean;
  readonly faulty: boolean;
  task: Promise<{ done: boolean; faulty: boolean }>;
}>();

// The runner only reads the outer examples and plugins arrays. Example values retain their own types.
const examples = Object.freeze<[number][]>([[42]]);
const plugins: readonly fc.Plugin<[number]>[] = [fc.beforeEach(() => {})];
const property = fc.property(fc.nat(), () => true);
expectTypeOf(fc.assert(property, { examples, plugins })).toEqualTypeOf<Promise<void>>();
expectTypeOf(fc.sample(property, { examples, plugins })).toEqualTypeOf<Promise<[number][]>>();
expectTypeOf(fc.sample(fc.nat(), { examples: [42] as const })).toEqualTypeOf<Promise<number[]>>();
const categories = ['positive', 'integer'] as const;
expectTypeOf(fc.statistics(property, () => categories, { examples, plugins })).toEqualTypeOf<
  Promise<fc.StatisticsResult>
>();
expectTypeOf(fc.statistics(fc.nat(), () => categories)).toEqualTypeOf<Promise<fc.StatisticsResult>>();
expectTypeOf(fc.statistics(fc.nat(), fc.string(), () => categories)).toEqualTypeOf<Promise<fc.StatisticsResult>>();
expectTypeOf(fc.statistics(property, () => categories, { noPredicateExecution: true })).toEqualTypeOf<
  Promise<fc.StatisticsResult>
>();

// Rest parameters already accept spread readonly inputs and must retain their inference.
expectTypeOf(fc.constantFrom(...nobleGasNames)).toEqualTypeOf<fc.Arbitrary<NobleGasName>>();
expectTypeOf(fc.tuple(...values)).toEqualTypeOf<fc.Arbitrary<[string, number]>>();
expectTypeOf(fc.oneof(...values)).toEqualTypeOf<fc.Arbitrary<string | number>>();
expectTypeOf(fc.property(...values, () => true)).toEqualTypeOf<fc.Property<[string, number]>>();
