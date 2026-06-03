import { describe, bench } from 'vitest';
import type { Arbitrary, Memo, Value } from '../../src/fast-check.js';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from './__test-helpers__/Imports.js';

type Fc = typeof fcCurrent;

type BenchCase = {
  /** Arbitrary expression, used as the benchmark group label */
  name: string;
  /** Builds the arbitrary from the provided fast-check module (either `current` or `main`) */
  build: (fc: Fc) => Arbitrary<unknown>;
};

const largeLength = { maxLength: 100, size: 'max' as const };

const benchCases: BenchCase[] = [
  // Numeric and primitive values
  { name: 'boolean()', build: (fc) => fc.boolean() },
  { name: 'integer()', build: (fc) => fc.integer() },
  { name: 'maxSafeInteger()', build: (fc) => fc.maxSafeInteger() },
  { name: 'bigInt()', build: (fc) => fc.bigInt() },
  { name: 'float()', build: (fc) => fc.float() },
  { name: 'double()', build: (fc) => fc.double() },
  { name: 'date()', build: (fc) => fc.date() },

  // Strings (default small size, an explicit larger size and a non-ASCII unit)
  { name: 'string()', build: (fc) => fc.string() },
  { name: "string({ maxLength: 100, size: 'max' })", build: (fc) => fc.string(largeLength) },
  { name: "string({ unit: 'grapheme' })", build: (fc) => fc.string({ unit: 'grapheme' }) },
  { name: 'base64String()', build: (fc) => fc.base64String() },

  // Collections (default small size and an explicit larger size for the bulk path)
  { name: 'array(integer())', build: (fc) => fc.array(fc.integer()) },
  { name: "array(integer(), { maxLength: 100, size: 'max' })", build: (fc) => fc.array(fc.integer(), largeLength) },
  { name: 'uniqueArray(integer())', build: (fc) => fc.uniqueArray(fc.integer()) },
  { name: 'set(integer())', build: (fc) => fc.set(fc.integer()) },
  { name: 'tuple(integer())', build: (fc) => fc.tuple(fc.integer()) },
  { name: 'record({ a: integer() })', build: (fc) => fc.record({ a: fc.integer() }) },
  { name: 'dictionary(string(), integer())', build: (fc) => fc.dictionary(fc.string(), fc.integer()) },
  { name: 'map(string(), integer())', build: (fc) => fc.map(fc.string(), fc.integer()) },

  // Choice and combinators
  { name: 'constantFrom(...)', build: (fc) => fc.constantFrom('a', 'b', 'c', 'd', 'e') },
  { name: 'oneof(integer(), integer())', build: (fc) => fc.oneof(fc.integer(), fc.integer()) },
  {
    name: 'oneof({ weight, arbitrary }, ...)',
    build: (fc) => fc.oneof({ arbitrary: fc.integer(), weight: 1 }, { arbitrary: fc.integer(), weight: 2 }),
  },
  { name: 'option(integer())', build: (fc) => fc.option(fc.integer()) },
  { name: 'subarray([1, 2, 3, 4, 5])', build: (fc) => fc.subarray([1, 2, 3, 4, 5]) },

  // Recursive structures
  {
    name: 'letrec(tree)',
    build: (fc) => {
      const { tree } = fc.letrec((tie) => ({
        tree: fc.oneof(tie('leaf'), tie('node')),
        node: fc.record({ left: tie('tree'), right: tie('tree') }),
        leaf: fc.nat(),
      }));
      return tree;
    },
  },
  {
    name: 'memo(tree)',
    build: (fc) => {
      const leaf = fc.nat;
      // oxlint-disable-next-line no-use-before-define -- `tree` and `node` reference each other
      const tree: Memo<unknown> = fc.memo((n) => fc.oneof(node(n), leaf()));
      const node: Memo<unknown> = fc.memo((n) => {
        if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
        return fc.record({ left: tree(), right: tree() });
      });
      return tree(3);
    },
  },

  // Structured data
  { name: 'anything()', build: (fc) => fc.anything() },
  { name: 'json()', build: (fc) => fc.json() },
  {
    name: 'entityGraph(node -> node)',
    build: (fc) =>
      fc.entityGraph({ node: { id: fc.integer() } }, { node: { linkTo: { arity: 'many', type: 'node' } } }),
  },

  // Formatted strings (web and identifiers)
  { name: 'emailAddress()', build: (fc) => fc.emailAddress() },
  { name: 'webUrl()', build: (fc) => fc.webUrl() },
  { name: 'ipV4()', build: (fc) => fc.ipV4() },
  { name: 'ipV6()', build: (fc) => fc.ipV6() },
  { name: 'uuid()', build: (fc) => fc.uuid() },
  { name: 'stringMatching(/^[a-zA-Z0-9]+$/)', build: (fc) => fc.stringMatching(/^[a-zA-Z0-9]+$/) },
  { name: 'mixedCase(string())', build: (fc) => fc.mixedCase(fc.string()) },

  // Operators chained on top of another arbitrary
  { name: 'integer().map(.)', build: (fc) => fc.integer().map((n) => n + 1) },
  { name: 'integer().chain(.)', build: (fc) => fc.integer().chain(() => fc.integer()) },
  { name: 'integer().filter(.)', build: (fc) => fc.integer().filter((n) => n % 2 === 0) },
];

const biasFactor = 3;
const numReplicas = 3;

for (const benchCase of benchCases) {
  describe(benchCase.name, () => {
    const current = benchCase.build(fcCurrent);
    const main = benchCase.build(fcMain);

    describe('generate', () => {
      for (let i = 0; i !== numReplicas; ++i) {
        bench(`current-${i}`, () => {
          current.generate(mrngCurrent, biasFactor);
        });
        bench(`main-${i}`, () => {
          main.generate(mrngMain, biasFactor);
        });
      }
    });

    describe('shrink', () => {
      for (let i = 0; i !== numReplicas; ++i) {
        let seedCurrent: Value<unknown>;
        let seedMain: Value<unknown>;
        bench(
          `current-${i}`,
          () => {
            current.shrink(seedCurrent.value, seedCurrent.context).next();
          },
          {
            setup() {
              seedCurrent = current.generate(mrngCurrent, biasFactor);
            },
          },
        );
        bench(
          `main-${i}`,
          () => {
            main.shrink(seedMain.value, seedMain.context).next();
          },
          {
            setup() {
              seedMain = main.generate(mrngMain, biasFactor);
            },
          },
        );
      }
    });
  });
}
