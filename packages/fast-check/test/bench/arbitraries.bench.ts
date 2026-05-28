import { describe, bench } from 'vitest';
import type { Arbitrary } from '../../src/fast-check.js';
import { fcCurrent, fcMain, mrngCurrent, mrngMain } from './__test-helpers__/Imports.js';

type Fc = typeof fcCurrent;

type BenchCase = {
  /** Arbitrary expression, used as the benchmark group label */
  name: string;
  /** Operation exercised on the arbitrary, defaults to `'generate'` */
  operation?: 'generate' | 'shrink';
  /** Builds the arbitrary from the provided fast-check module (either `current` or `main`) */
  build: (fc: Fc) => Arbitrary<unknown>;
};

// Every benchmarked configuration lives in this single array so the full surface we track for
// performance regressions can be reviewed at a glance. When an arbitrary gets a performance PR,
// add one key case here rather than spreading benchmarks across many files.
const benchCases: BenchCase[] = [
  { name: 'integer()', build: (fc) => fc.integer() },
  { name: 'array(integer())', build: (fc) => fc.array(fc.integer()) },
  { name: 'tuple(integer(), integer())', build: (fc) => fc.tuple(fc.integer(), fc.integer()) },
  { name: 'constantFrom(...)', build: (fc) => fc.constantFrom('a', 'b', 'c', 'd', 'e') },
  { name: 'string()', build: (fc) => fc.string() },
  { name: 'integer().map(.)', build: (fc) => fc.integer().map((n) => n + 1) },
  { name: 'integer().chain(.)', build: (fc) => fc.integer().chain((n) => fc.integer({ min: n })) },
  // The filter speed-up only impacts the shrink hot path, so this case shrinks instead of generates.
  { name: 'integer().filter(.)', operation: 'shrink', build: (fc) => fc.integer().filter((n) => n % 2 === 0) },
];

function drain(stream: IterableIterator<unknown>): void {
  let next = stream.next();
  while (!next.done) {
    next = stream.next();
  }
}

for (const benchCase of benchCases) {
  const operation = benchCase.operation ?? 'generate';
  describe(benchCase.name, () => {
    describe(operation, () => {
      const current = benchCase.build(fcCurrent);
      const main = benchCase.build(fcMain);
      if (operation === 'shrink') {
        // Seed a value (with its context) once, then shrink it on each run, fully draining the lazy stream.
        const seedCurrent = current.generate(mrngCurrent, 3);
        const seedMain = main.generate(mrngMain, 3);
        bench('current', () => {
          drain(current.shrink(seedCurrent.value, seedCurrent.context));
        });
        bench('main', () => {
          drain(main.shrink(seedMain.value, seedMain.context));
        });
      } else {
        bench('current', () => {
          current.generate(mrngCurrent, 3);
        });
        bench('main', () => {
          main.generate(mrngMain, 3);
        });
      }
    });
  });
}
