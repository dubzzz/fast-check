import { describe, bench } from 'vitest';
import type { Arbitrary, Value } from '../../src/fast-check.js';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from './__test-helpers__/Imports.js';

type Fc = typeof fcCurrent;

type BenchCase = {
  /** Arbitrary expression, used as the benchmark group label */
  name: string;
  /** Builds the arbitrary from the provided fast-check module (either `current` or `main`) */
  build: (fc: Fc) => Arbitrary<unknown>;
};

// Every benchmarked arbitrary lives in this single array so the full surface we track for
// performance regressions can be reviewed at a glance. Each entry is benchmarked the same way:
// construction, generation and shrinking. When an arbitrary gets a performance PR, add one key
// case here rather than spreading benchmarks across many files.
const benchCases: BenchCase[] = [
  { name: 'integer()', build: (fc) => fc.integer() },
  { name: 'array(integer())', build: (fc) => fc.array(fc.integer()) },
  { name: 'tuple(integer(), integer())', build: (fc) => fc.tuple(fc.integer(), fc.integer()) },
  { name: 'constantFrom(...)', build: (fc) => fc.constantFrom('a', 'b', 'c', 'd', 'e') },
  { name: 'string()', build: (fc) => fc.string() },
  { name: 'integer().map(.)', build: (fc) => fc.integer().map((n) => n + 1) },
  { name: 'integer().chain(.)', build: (fc) => fc.integer().chain((n) => fc.integer({ min: n })) },
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
