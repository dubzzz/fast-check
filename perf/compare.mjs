// Compares the generation throughput of the local/PR build of fast-check against
// the one currently published for `main`. Both builds are loaded side by side in
// the same process under two aliases:
//   - `fast-check-current`: the build under test (this PR / your working copy)
//   - `fast-check-main`    : the baseline to compare against (the `main` branch)
//
// Getting the two builds in place:
//
//   Locally
//     pnpm --filter fast-check run build      # build your working copy
//     cd perf
//     npm run use:current:local               # alias it as fast-check-current
//     npm run use:main:pkg-pr-new             # fetch main from pkg.pr.new
//     npm run benchmark
//
//   In CI (.github/workflows/benchmark.yml)
//     the PR bundle is installed as fast-check-current from the build artifact,
//     and main is restored from cache as package.tgz then installed as
//     fast-check-main.
//
// The baseline is mandatory: if `fast-check-main` cannot be loaded (e.g. the main
// bundle is missing from the run) the script exits non-zero rather than reporting
// half a comparison.

import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const SEED = 42;
const VALUES_PER_SAMPLE = 1000;
const WARMUP_MS = 300;
const MEASURE_MS = 2000;

// Each benchmark exercises one composition primitive of `Arbitrary` through the
// public `sample` API, which drives `generate` `VALUES_PER_SAMPLE` times.
function defineBenchmarks(fc) {
  const filtered = fc.integer({ min: 0, max: 1000 }).filter((n) => n % 2 === 0);
  const mapped = fc.integer().map((n) => n + 1);
  const chained = fc.nat({ max: 10 }).chain((n) => fc.array(fc.nat(), { maxLength: n }));
  return [
    {
      name: 'integer().filter(n => n % 2 === 0)',
      run: () => fc.sample(filtered, { numRuns: VALUES_PER_SAMPLE, seed: SEED }),
    },
    {
      name: 'integer().map(n => n + 1)',
      run: () => fc.sample(mapped, { numRuns: VALUES_PER_SAMPLE, seed: SEED }),
    },
    {
      name: 'nat().chain(n => array(nat(), { maxLength: n }))',
      run: () => fc.sample(chained, { numRuns: VALUES_PER_SAMPLE, seed: SEED }),
    },
  ];
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Returns the median throughput in generated-values per second.
function measure(run) {
  const warmupEnd = performance.now() + WARMUP_MS;
  while (performance.now() < warmupEnd) run();

  const durationsMs = [];
  const measureEnd = performance.now() + MEASURE_MS;
  while (performance.now() < measureEnd) {
    const start = performance.now();
    run();
    durationsMs.push(performance.now() - start);
  }
  return (VALUES_PER_SAMPLE / median(durationsMs)) * 1000;
}

async function loadBuild(specifier) {
  const mod = await import(specifier);
  return mod.default ?? mod;
}

function formatOps(ops) {
  if (!Number.isFinite(ops)) return '—';
  if (ops >= 1e6) return `${(ops / 1e6).toFixed(2)}M`;
  if (ops >= 1e3) return `${(ops / 1e3).toFixed(1)}k`;
  return ops.toFixed(0);
}

function formatDelta(mainOps, prOps) {
  if (!Number.isFinite(mainOps) || !Number.isFinite(prOps) || mainOps === 0) return '—';
  const delta = ((prOps - mainOps) / mainOps) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

async function main() {
  let current;
  try {
    current = await loadBuild('fast-check-current');
  } catch (error) {
    console.error('✖ Could not load the build under test (`fast-check-current`).');
    console.error('  Locally: run `npm run use:current:local` after building fast-check.');
    console.error(`  Underlying error: ${error.message}`);
    process.exit(1);
  }

  let baseline;
  try {
    baseline = await loadBuild('fast-check-main');
  } catch (error) {
    console.error('✖ Could not load the `main` baseline (`fast-check-main`).');
    console.error('  In CI this means the main bundle (package.tgz) was missing from the run.');
    console.error('  Locally: run `npm run use:main:pkg-pr-new` to fetch it from pkg.pr.new.');
    console.error(`  Underlying error: ${error.message}`);
    process.exit(1);
  }

  const versions = [
    { label: 'main', fc: baseline },
    { label: 'this PR', fc: current },
  ];
  for (const version of versions) {
    version.benchmarks = defineBenchmarks(version.fc);
  }

  const names = versions[0].benchmarks.map((benchmark) => benchmark.name);
  const opsByName = new Map(names.map((name) => [name, {}]));

  // Interleave versions per benchmark to limit drift from background noise.
  for (let i = 0; i < names.length; ++i) {
    for (const version of versions) {
      const benchmark = version.benchmarks[i];
      const ops = measure(benchmark.run);
      opsByName.get(benchmark.name)[version.label] = ops;
      console.log(`[${version.label}] ${benchmark.name}: ${formatOps(ops)} ops/s`);
    }
  }

  const rows = names.map((name) => {
    const ops = opsByName.get(name);
    return `| \`${name}\` | ${formatOps(ops['main'])} | ${formatOps(ops['this PR'])} | ${formatDelta(ops['main'], ops['this PR'])} |`;
  });

  const report = [
    '### ⚡ Arbitrary benchmark',
    '',
    "Generation throughput of this PR's build versus `main`. Higher `ops/s` is better; Δ is this PR relative to `main` (positive means faster).",
    '',
    '| Benchmark | `main` (ops/s) | this PR (ops/s) | Δ |',
    '| :--- | ---: | ---: | ---: |',
    ...rows,
    '',
    `<sub>node ${process.version} · seed ${SEED} · ${VALUES_PER_SAMPLE} values/sample · median over ${MEASURE_MS}ms (after ${WARMUP_MS}ms warmup) · micro-benchmark, treat small deltas as noise</sub>`,
    '',
    '<!-- fast-check-benchmark -->',
    '',
  ].join('\n');

  const reportPath = process.env.BENCHMARK_REPORT_PATH ?? new URL('./benchmark-report.md', import.meta.url);
  writeFileSync(reportPath, report);
  console.log(`\n${report}`);
}

main();
