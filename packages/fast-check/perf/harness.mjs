// Lightweight benchmark harness for fast-check arbitraries.
// Provides:
//   bench(name, fn, opts?)  -> { name, opsPerSec, mean, p50, runs, elapsed }
//   runSuite(label, cases)  -> prints comparison rows
//   compare(baseline, current) -> ratio + delta %
//
// Usage:
//   node perf/harness.mjs            -> run default suites against ./lib
//   PERF_TARGET=./lib node ...       -> override target build
//   PERF_DURATION_MS=2000 node ...   -> override measurement duration
//
// Note: requires `pnpm build` to have been run beforehand so `./lib/fast-check.js`
// reflects the source tree under test. We import from the built bundle to keep
// the measurement free of any TS-loader overhead.

import { performance } from 'node:perf_hooks';

const DEFAULT_DURATION_MS = Number(process.env.PERF_DURATION_MS || 1500);
const DEFAULT_WARMUP_MS = Number(process.env.PERF_WARMUP_MS || 300);
const DEFAULT_BATCH = Number(process.env.PERF_BATCH || 256);
const DEFAULT_RUNS = Number(process.env.PERF_RUNS || 5);

export function bench(name, fn, {
  durationMs = DEFAULT_DURATION_MS,
  warmupMs = DEFAULT_WARMUP_MS,
  batch = DEFAULT_BATCH,
  runs = DEFAULT_RUNS,
} = {}) {
  // Warm up
  const warmEnd = performance.now() + warmupMs;
  while (performance.now() < warmEnd) {
    for (let i = 0; i < batch; ++i) fn();
  }

  const samples = [];
  for (let r = 0; r < runs; ++r) {
    const end = performance.now() + durationMs / runs;
    let iters = 0;
    const start = performance.now();
    while (performance.now() < end) {
      for (let i = 0; i < batch; ++i) fn();
      iters += batch;
    }
    const elapsed = (performance.now() - start) / 1000;
    samples.push(iters / elapsed);
  }
  samples.sort((a, b) => a - b);
  const median = samples[(samples.length - 1) >> 1];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const min = samples[0];
  const max = samples[samples.length - 1];
  return { name, median, mean, min, max, samples };
}

function fmt(ops) {
  if (ops >= 1e9) return (ops / 1e9).toFixed(2) + 'G';
  if (ops >= 1e6) return (ops / 1e6).toFixed(2) + 'M';
  if (ops >= 1e3) return (ops / 1e3).toFixed(2) + 'k';
  return ops.toFixed(0);
}

export function printResult(r) {
  const noise = ((r.max - r.min) / r.median) * 100;
  console.log(
    `  ${r.name.padEnd(48)}  ${fmt(r.median).padStart(8)} ops/s  ` +
    `(±${noise.toFixed(1)}% across ${r.samples.length} runs)`
  );
}

export function printCompare(baseline, current) {
  const ratio = current.median / baseline.median;
  const delta = (ratio - 1) * 100;
  const sign = delta >= 0 ? '+' : '';
  console.log(
    `  ${baseline.name.padEnd(48)}  base=${fmt(baseline.median).padStart(8)}  ` +
    `cur=${fmt(current.median).padStart(8)}  ${sign}${delta.toFixed(1)}%  (x${ratio.toFixed(3)})`
  );
}

export async function loadFc(target = process.env.PERF_TARGET || './lib/fast-check.js') {
  const url = new URL(target, import.meta.url);
  return await import(url.href);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Allow `node perf/harness.mjs <suiteFile>` to delegate.
  const target = process.argv[2];
  if (target) {
    await import(new URL(target, import.meta.url).href);
  } else {
    console.log('Usage: node perf/harness.mjs <suite.mjs>');
  }
}
