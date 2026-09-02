// Micro-benchmark for the plugin completion hooks (`onAllRunsComplete` and `afterAll`).
//
// Each benched operation is one `fc.check` call on an asynchronous property: completion
// hooks run once per check, so the benchmark stresses many small checks rather than one
// large one.
//
// Usage: node perf/completion-hooks.bench.mjs [path-to-fast-check-entry]
//   path-to-fast-check-entry — defaults to ../lib/fast-check.js (the built library).
//   NUM_RUNS       — numRuns forwarded to every check (default: 1)
//   CALLS_PER_SAMPLE, SAMPLES, WARMUP_SAMPLES — sampling knobs
//   SCENARIO       — only run scenarios whose name contains this substring
//   FORMAT=json    — one JSON line per scenario instead of the human-readable table
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const libPath = process.argv[2] ?? new URL('../lib/fast-check.js', import.meta.url).pathname;
const fc = await import(pathToFileURL(libPath).href);

const numRuns = Number(process.env.NUM_RUNS ?? '1');
const callsPerSample = Number(process.env.CALLS_PER_SAMPLE ?? '200');
const samples = Number(process.env.SAMPLES ?? '15');
const warmupSamples = Number(process.env.WARMUP_SAMPLES ?? '5');
const format = process.env.FORMAT ?? 'human';

const syncHooksPlugin = () => ({ onAllRunsComplete: () => undefined, afterAll: () => undefined });
const asyncHooksPlugin = () => ({ onAllRunsComplete: async () => undefined, afterAll: async () => undefined });
const scenarios = [
  { name: 'no plugin', plugins: [] },
  { name: '2 plugins, sync hooks', plugins: [syncHooksPlugin, syncHooksPlugin] },
  { name: '10 plugins, sync hooks', plugins: Array.from({ length: 10 }, () => syncHooksPlugin) },
  {
    name: '5 plugins, 1 async + 4 sync',
    plugins: [asyncHooksPlugin, ...Array.from({ length: 4 }, () => syncHooksPlugin)],
  },
  { name: '5 plugins, async hooks', plugins: Array.from({ length: 5 }, () => asyncHooksPlugin) },
];

async function benchScenario(scenario) {
  const property = fc.asyncProperty(fc.integer(), async (_x) => true);
  const parameters = { numRuns, seed: 42, plugins: scenario.plugins };
  const opsPerSec = [];
  for (let sampleIndex = 0; sampleIndex !== warmupSamples + samples; ++sampleIndex) {
    const startMs = performance.now();
    for (let call = 0; call !== callsPerSample; ++call) {
      const details = await fc.check(property, parameters);
      if (details.failed) {
        throw new Error('Benchmark property unexpectedly failed');
      }
    }
    const elapsedMs = performance.now() - startMs;
    if (sampleIndex >= warmupSamples) {
      opsPerSec.push((callsPerSample * 1000) / elapsedMs);
    }
  }
  opsPerSec.sort((a, b) => a - b);
  const median = opsPerSec[opsPerSec.length >> 1];
  const mean = opsPerSec.reduce((acc, value) => acc + value, 0) / opsPerSec.length;
  const stddev = Math.sqrt(opsPerSec.reduce((acc, value) => acc + (value - mean) ** 2, 0) / opsPerSec.length);
  return { scenario: scenario.name, numRuns, median, mean, rsdPercent: (100 * stddev) / mean };
}

const scenarioFilter = process.env.SCENARIO ?? '';
for (const scenario of scenarios.filter((s) => s.name.includes(scenarioFilter))) {
  const result = await benchScenario(scenario);
  if (format === 'json') {
    console.log(JSON.stringify(result));
  } else {
    const median = result.median.toFixed(0).padStart(8);
    console.log(
      `${result.scenario.padEnd(30)} ${median} checks/s (±${result.rsdPercent.toFixed(1)}%, numRuns=${result.numRuns})`,
    );
  }
}
