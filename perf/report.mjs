// Turns the JSON produced by `vitest bench --outputJson` into the Markdown table
// posted as a comment on the pull request.
//   node perf/report.mjs <bench.json> [report.md]
// When no output path is given the report is only printed to stdout.

import { readFileSync, writeFileSync } from 'node:fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (inputPath === undefined) {
  console.error('usage: node perf/report.mjs <bench.json> [report.md]');
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, 'utf8'));

function formatHz(hz) {
  if (!Number.isFinite(hz)) return '—';
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)}M`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)}k`;
  return hz.toFixed(2);
}

function formatDelta(mainHz, prHz) {
  if (!Number.isFinite(mainHz) || !Number.isFinite(prHz) || mainHz === 0) return '—';
  const delta = ((prHz - mainHz) / mainHz) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

const rows = [];
for (const file of data.files ?? []) {
  for (const group of file.groups ?? []) {
    const byName = new Map((group.benchmarks ?? []).map((benchmark) => [benchmark.name, benchmark]));
    const name = group.fullName.replace(/^.*?>\s*/, '');
    rows.push({ name, mainHz: byName.get('main')?.hz, prHz: byName.get('this PR')?.hz });
  }
}

const table = [
  '| Benchmark | `main` (ops/s) | this PR (ops/s) | Δ |',
  '| :--- | ---: | ---: | ---: |',
  ...rows.map(
    (row) =>
      `| \`${row.name}\` | ${formatHz(row.mainHz)} | ${formatHz(row.prHz)} | ${formatDelta(row.mainHz, row.prHz)} |`,
  ),
].join('\n');

const report = [
  '### ⚡ Arbitrary benchmark',
  '',
  "Generation throughput of this PR's build versus `main`, measured with `vitest bench`. " +
    'Higher `ops/s` is better; Δ is this PR relative to `main` (positive means faster).',
  '',
  table,
  '',
  `<sub>node ${process.version} · micro-benchmark, treat small deltas as noise · see perf/arbitrary.bench.ts</sub>`,
  '',
  '<!-- fast-check-benchmark -->',
  '',
].join('\n');

if (outputPath !== undefined) {
  writeFileSync(outputPath, report);
}
process.stdout.write(`${report}\n`);
