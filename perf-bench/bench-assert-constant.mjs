// Benchmark: assert(property(constant(1), () => {}))
// Goal: measure the cost of the runner / property / arbitrary plumbing
// when the predicate is trivial and the arbitrary produces a single constant.

import { assert, property, constant } from '../packages/fast-check/lib/fast-check.js';

const TOTAL_ASSERT_CALLS = Number(process.env.ASSERT_CALLS || 5000);
const NUM_RUNS = Number(process.env.NUM_RUNS || 100); // default fast-check numRuns

// warm up
for (let i = 0; i < 200; ++i) {
  assert(
    property(constant(1), () => {}),
    { numRuns: NUM_RUNS },
  );
}

const samples = [];
const SAMPLE_COUNT = 5;
for (let s = 0; s < SAMPLE_COUNT; ++s) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < TOTAL_ASSERT_CALLS; ++i) {
    assert(
      property(constant(1), () => {}),
      { numRuns: NUM_RUNS },
    );
  }
  const end = process.hrtime.bigint();
  const ns = Number(end - start);
  samples.push(ns);
}

samples.sort((a, b) => a - b);
const median = samples[Math.floor(samples.length / 2)];
const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
const min = samples[0];
const max = samples[samples.length - 1];
const totalIterations = TOTAL_ASSERT_CALLS * NUM_RUNS;

console.log(`assert calls: ${TOTAL_ASSERT_CALLS}, numRuns each: ${NUM_RUNS}`);
console.log(`samples (ms): ${samples.map((s) => (s / 1e6).toFixed(2)).join(', ')}`);
console.log(`min:    ${(min / 1e6).toFixed(2)} ms   (${(min / TOTAL_ASSERT_CALLS).toFixed(1)} ns/assert, ${(min / totalIterations).toFixed(1)} ns/iter)`);
console.log(`median: ${(median / 1e6).toFixed(2)} ms   (${(median / TOTAL_ASSERT_CALLS).toFixed(1)} ns/assert, ${(median / totalIterations).toFixed(1)} ns/iter)`);
console.log(`mean:   ${(mean / 1e6).toFixed(2)} ms`);
console.log(`max:    ${(max / 1e6).toFixed(2)} ms`);
