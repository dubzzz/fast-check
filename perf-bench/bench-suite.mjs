// Comprehensive benchmark suite for fast-check perf optimizations.
// Each scenario isolates a different part of the hot path.

import { assert, property, constant, integer } from '../packages/fast-check/lib/fast-check.js';

const SAMPLE_COUNT = 25;
const WARMUP = 1000;

function bench(name, iterations, fn) {
  for (let i = 0; i < WARMUP; ++i) fn();
  const samples = [];
  for (let s = 0; s < SAMPLE_COUNT; ++s) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; ++i) fn();
    const end = process.hrtime.bigint();
    samples.push(Number(end - start));
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  const min = samples[0];
  // Trim mean (drop top/bottom 25%, mean the rest)
  const q1 = Math.floor(samples.length / 4);
  const q3 = Math.ceil(samples.length * 3 / 4);
  const trimmed = samples.slice(q1, q3);
  const trimmedMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  return { name, iterations, samples, median, min, trimmedMean };
}

function report(r) {
  const perCallNs = r.trimmedMean / r.iterations;
  console.log(
    `${r.name.padEnd(56)} iter=${r.iterations.toString().padStart(5)}  trimmean=${(r.trimmedMean / 1e6).toFixed(2)}ms (${perCallNs.toFixed(1)}ns/call)  min=${(r.min / 1e6).toFixed(2)}ms`,
  );
}

const scenarios = [
  {
    name: 'assert(property(constant(1), () => {}))',
    iterations: 3000,
    setup: () => {
      const pred = () => {};
      const arb = constant(1);
      return () => assert(property(arb, pred), { numRuns: 100 });
    },
  },
  {
    name: 'assert(prebuilt) numRuns=100',
    iterations: 5000,
    setup: () => {
      const prop = property(constant(1), () => {});
      return () => assert(prop, { numRuns: 100 });
    },
  },
  {
    name: 'assert(prebuilt) numRuns=1',
    iterations: 30000,
    setup: () => {
      const prop = property(constant(1), () => {});
      return () => assert(prop, { numRuns: 1 });
    },
  },
  {
    name: 'assert(prebuilt) numRuns=10',
    iterations: 15000,
    setup: () => {
      const prop = property(constant(1), () => {});
      return () => assert(prop, { numRuns: 10 });
    },
  },
  {
    name: 'assert(prebuilt) numRuns=1000',
    iterations: 600,
    setup: () => {
      const prop = property(constant(1), () => {});
      return () => assert(prop, { numRuns: 1000 });
    },
  },
  {
    name: 'assert(property(integer(), () => {}))',
    iterations: 3000,
    setup: () => {
      const prop = property(integer(), () => {});
      return () => assert(prop, { numRuns: 100 });
    },
  },
  {
    name: 'assert(property(int, int, int) -> noop)',
    iterations: 1500,
    setup: () => {
      const prop = property(integer(), integer(), integer(), () => {});
      return () => assert(prop, { numRuns: 100 });
    },
  },
  {
    name: 'assert(property(int) -> a+1 > a)',
    iterations: 3000,
    setup: () => {
      const prop = property(integer(), (a) => a + 1 > a || a === 0x7fffffff);
      return () => assert(prop, { numRuns: 100 });
    },
  },
];

console.log(`Node ${process.version}, samples=${SAMPLE_COUNT}, warmup=${WARMUP}`);
console.log();

for (const sc of scenarios) {
  const fn = sc.setup();
  const r = bench(sc.name, sc.iterations, fn);
  report(r);
}
