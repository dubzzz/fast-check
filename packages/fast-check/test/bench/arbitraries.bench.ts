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

for (const benchCase of benchCases) {
  describe(benchCase.name, () => {
    describe('construct', () => {
      bench('current', () => {
        benchCase.build(fcCurrent);
      });
      bench('main', () => {
        benchCase.build(fcMain);
      });
    });

    describe('generate', () => {
      const current = benchCase.build(fcCurrent);
      const main = benchCase.build(fcMain);
      bench('current', () => {
        current.generate(mrngCurrent, 3);
      });
      bench('main', () => {
        main.generate(mrngMain, 3);
      });
    });

    describe('shrink', () => {
      const current = benchCase.build(fcCurrent);
      const main = benchCase.build(fcMain);
      // The value to shrink is produced once per run as a preparation step, so only the shrink
      // itself is measured. We pull a single shrink candidate out of the lazy stream.
      let seedCurrent: Value<unknown>;
      let seedMain: Value<unknown>;
      bench(
        'current',
        () => {
          current.shrink(seedCurrent.value, seedCurrent.context).next();
        },
        {
          setup() {
            seedCurrent = current.generate(mrngCurrent, 3);
          },
        },
      );
      bench(
        'main',
        () => {
          main.shrink(seedMain.value, seedMain.context).next();
        },
        {
          setup() {
            seedMain = main.generate(mrngMain, 3);
          },
        },
      );
    });
  });
}
