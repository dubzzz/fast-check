import { bench, describe } from 'vitest';
import fcCurrent from 'fast-check-current';
import fcMain from 'fast-check-main';

// `fast-check-current` is the build under test (this PR / your working copy) and
// `fast-check-main` is the baseline published for main. Both are wired up by
// vitest.bench.config.mts, which also fails fast when either build is missing.

const SEED = 42;
const NUM_RUNS = 1000;

const builds = [
  ['main', fcMain],
  ['this PR', fcCurrent],
];

// Each suite exercises one composition primitive of `Arbitrary` through the
// public `sample` API, which drives `generate` `NUM_RUNS` times.

describe('integer().filter(n => n % 2 === 0)', () => {
  for (const [label, fc] of builds) {
    const arbitrary = fc.integer({ min: 0, max: 1000 }).filter((n) => n % 2 === 0);
    bench(label, () => {
      fc.sample(arbitrary, { numRuns: NUM_RUNS, seed: SEED });
    });
  }
});

describe('integer().map(n => n + 1)', () => {
  for (const [label, fc] of builds) {
    const arbitrary = fc.integer().map((n) => n + 1);
    bench(label, () => {
      fc.sample(arbitrary, { numRuns: NUM_RUNS, seed: SEED });
    });
  }
});

describe('nat().chain(n => array(nat(), { maxLength: n }))', () => {
  for (const [label, fc] of builds) {
    const arbitrary = fc.nat({ max: 10 }).chain((n) => fc.array(fc.nat(), { maxLength: n }));
    bench(label, () => {
      fc.sample(arbitrary, { numRuns: NUM_RUNS, seed: SEED });
    });
  }
});
