// Save baseline measurements for the current build. Use `node perf/baseline.mjs save`
// to write `perf/baseline.json` and `node perf/baseline.mjs compare` to compare
// the current build against the saved baseline.
//
// Each entry is { suite, name, median }.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(__dirname, 'baseline.json');

import { runAll } from './suites.mjs';

const mode = process.argv[2] || 'compare';

const results = await runAll({ quiet: true });

if (mode === 'save') {
  writeFileSync(baselinePath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} entries to ${baselinePath}`);
  for (const r of results) {
    console.log(`  [${r.suite}] ${r.name}: ${r.median.toFixed(0)} ops/s`);
  }
} else if (mode === 'compare') {
  if (!existsSync(baselinePath)) {
    console.error(`No baseline at ${baselinePath}. Run \`node perf/baseline.mjs save\` first.`);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const baseMap = new Map(baseline.map((r) => [`${r.suite}::${r.name}`, r]));
  let totalDelta = 0;
  let countDelta = 0;
  let minDelta = Infinity;
  let maxDelta = -Infinity;
  const worst = [];
  for (const r of results) {
    const key = `${r.suite}::${r.name}`;
    const b = baseMap.get(key);
    if (!b) continue;
    const ratio = r.median / b.median;
    const delta = (ratio - 1) * 100;
    totalDelta += delta;
    countDelta++;
    if (delta < minDelta) minDelta = delta;
    if (delta > maxDelta) maxDelta = delta;
    worst.push({ key, delta });
    const sign = delta >= 0 ? '+' : '';
    console.log(
      `[${r.suite}] ${r.name.padEnd(46)}  base=${b.median.toFixed(0).padStart(11)}  ` +
      `cur=${r.median.toFixed(0).padStart(11)}  ${sign}${delta.toFixed(1).padStart(6)}%  (x${ratio.toFixed(3)})`
    );
  }
  const mean = totalDelta / countDelta;
  console.log('---');
  console.log(`mean Δ: ${mean >= 0 ? '+' : ''}${mean.toFixed(2)}%   min: ${minDelta.toFixed(1)}%   max: ${maxDelta.toFixed(1)}%   (n=${countDelta})`);
  worst.sort((a, b) => a.delta - b.delta);
  console.log('Worst 5:');
  for (const w of worst.slice(0, 5)) console.log(`  ${w.key.padEnd(60)} ${w.delta.toFixed(1)}%`);
  console.log('Best 5:');
  for (const w of worst.slice(-5).reverse()) console.log(`  ${w.key.padEnd(60)} ${w.delta.toFixed(1)}%`);
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
