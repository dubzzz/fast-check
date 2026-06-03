// @ts-check

/**
 * @typedef {Object} VitestBenchmark
 * @property {string} name - Benchmark name, eg. `current-0` or `main-2`.
 * @property {number} hz - Operations per second.
 */

/**
 * @typedef {Object} VitestGroup
 * @property {string} fullName - eg. `test/bench/arbitraries.bench.ts > integer() > generate`.
 * @property {VitestBenchmark[]} benchmarks
 */

/**
 * @typedef {Object} VitestFile
 * @property {string} filepath
 * @property {VitestGroup[]} groups
 */

/**
 * @typedef {Object} Row
 * @property {string} name - Benchmark label, eg. `integer()`.
 * @property {number|undefined} current - Best ops/sec measured for this PR.
 * @property {number|undefined} main - Best ops/sec measured for `main`.
 */

// Relative difference below which a change is considered noise rather than a real
// improvement/regression. GitHub-hosted runners are shared, so small deltas are expected.
const NEUTRAL_THRESHOLD = 0.02;

// Hard cap on the raw vitest output we inline in the comment. A full run produces more
// than GitHub's 65536 chars comment limit, so we keep the headline tables and truncate the rest.
const MAX_RAW_LENGTH = 45000;

/**
 * Format a number of operations per second into a compact, human readable string.
 * @param {number|undefined} hz
 * @returns {string}
 */
function formatHz(hz) {
  if (typeof hz !== 'number' || !Number.isFinite(hz) || hz <= 0) return 'n/a';
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)}B`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)}M`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)}k`;
  return hz.toFixed(0);
}

/**
 * Format a ratio (current / main) as a signed percentage prefixed with a status emoji.
 * @param {number} ratio
 * @returns {string}
 */
function formatChange(ratio) {
  const pct = (ratio - 1) * 100;
  const sign = pct >= 0 ? '+' : '';
  let emoji = '⚪';
  if (ratio > 1 + NEUTRAL_THRESHOLD) emoji = '🟢';
  else if (ratio < 1 - NEUTRAL_THRESHOLD) emoji = '🔴';
  return `${emoji} ${sign}${pct.toFixed(1)}%`;
}

/**
 * Remove ANSI escape codes (colors) from a string.
 * @param {string} text
 * @returns {string}
 */
function stripAnsi(text) {
  // oxlint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[mK]/g, '');
}

/**
 * Escape the characters that would break a Markdown table cell.
 * @param {string} text
 * @returns {string}
 */
function escapeCell(text) {
  return text.replace(/\|/g, '\\|');
}

/**
 * Turn the raw vitest output into a collapsible details block, dropping the (now redundant)
 * `BENCH Summary` section and truncating if it would not fit in a comment.
 * @param {string} raw
 * @returns {string[]}
 */
function buildRawDetails(raw) {
  let cleaned = stripAnsi(raw).trim();
  const summaryAt = cleaned.search(/\n\s*BENCH\s+Summary/);
  if (summaryAt !== -1) {
    cleaned = cleaned.slice(0, summaryAt).trim();
  }
  let truncated = false;
  if (cleaned.length > MAX_RAW_LENGTH) {
    cleaned = `${cleaned.slice(0, MAX_RAW_LENGTH).trimEnd()}\n…`;
    truncated = true;
  }
  const lines = ['<details><summary>Raw vitest output</summary>', '', '```', cleaned, '```'];
  if (truncated) {
    lines.push('', '_Output truncated — see the full `bench-output` artifact on the workflow run._');
  }
  lines.push('</details>');
  return lines;
}

/**
 * Build the Markdown body comparing this PR (`current`) against `main`.
 *
 * The benchmark file runs every case several times for both sides (`current-0`, `main-0`, …);
 * for each case we keep the best ops/sec per side and report the relative change, instead of
 * the default vitest summary that ranks every individual run against each other.
 *
 * @param {{ json: string, raw?: string }} inputs
 * @returns {string}
 */
function formatBenchResults({ json, raw }) {
  /** @type {{ files?: VitestFile[] }} */
  let report = {};
  try {
    report = JSON.parse(json);
  } catch {
    report = {};
  }
  const files = Array.isArray(report.files) ? report.files : [];

  // Group rows by scenario (the trailing segment of the full name, eg. `generate`/`shrink`),
  // preserving the order in which scenarios and rows are first seen.
  /** @type {Map<string, Row[]>} */
  const sections = new Map();

  for (const file of files) {
    for (const group of file.groups || []) {
      const parts = (group.fullName || '').split(' > ');
      // parts[0] is the file path, then the nested describe names. The last one is the scenario.
      const scenario = parts.length >= 3 ? parts[parts.length - 1] : '';
      const name = parts.length >= 3 ? parts.slice(1, -1).join(' > ') : parts.slice(1).join(' > ') || group.fullName;

      /** @type {number[]} */
      const currentHzs = [];
      /** @type {number[]} */
      const mainHzs = [];
      for (const benchmark of group.benchmarks || []) {
        if (typeof benchmark.hz !== 'number' || !Number.isFinite(benchmark.hz)) continue;
        if (benchmark.name.startsWith('current')) currentHzs.push(benchmark.hz);
        else if (benchmark.name.startsWith('main')) mainHzs.push(benchmark.hz);
      }

      let rows = sections.get(scenario);
      if (rows === undefined) {
        rows = [];
        sections.set(scenario, rows);
      }
      rows.push({
        name,
        current: currentHzs.length !== 0 ? Math.max(...currentHzs) : undefined,
        main: mainHzs.length !== 0 ? Math.max(...mainHzs) : undefined,
      });
    }
  }

  /** @type {string[]} */
  const lines = [];

  if (sections.size === 0) {
    lines.push('_No benchmark results were produced._');
  } else {
    lines.push(
      'This PR (`current`) vs `main`, using the best ops/sec across runs (higher is better). 🟢 faster · 🔴 slower · ⚪ within ±2%.',
    );

    for (const [scenario, rows] of sections) {
      lines.push('');
      if (scenario !== '') lines.push(`#### ${scenario}`);
      lines.push('');
      lines.push('| Benchmark | `main` (ops/sec) | This PR (ops/sec) | Change |');
      lines.push('| :-- | --: | --: | :-- |');

      let logSum = 0;
      let comparable = 0;
      let faster = 0;
      let slower = 0;
      let neutral = 0;

      for (const row of rows) {
        let change;
        if (row.current !== undefined && row.main !== undefined && row.main > 0) {
          const ratio = row.current / row.main;
          change = formatChange(ratio);
          logSum += Math.log(ratio);
          comparable += 1;
          if (ratio > 1 + NEUTRAL_THRESHOLD) faster += 1;
          else if (ratio < 1 - NEUTRAL_THRESHOLD) slower += 1;
          else neutral += 1;
        } else if (row.current !== undefined) {
          change = '🆕 new';
        } else {
          change = '⚰️ removed';
        }
        lines.push(`| \`${escapeCell(row.name)}\` | ${formatHz(row.main)} | ${formatHz(row.current)} | ${change} |`);
      }

      if (comparable !== 0) {
        const geomean = Math.exp(logSum / comparable);
        lines.push('');
        lines.push(
          `_Overall: ${formatChange(geomean)} (geomean) · ${faster} faster, ${slower} slower, ${neutral} unchanged._`,
        );
      }
    }
  }

  if (raw !== undefined && raw !== '') {
    lines.push('');
    lines.push(...buildRawDetails(raw));
  }

  return lines.join('\n');
}

exports.formatBenchResults = formatBenchResults;

// Allow running the formatter directly for local checks:
//   node .github/workflows/scripts/format-bench.cjs bench-output.json bench-output.txt
if (require.main === module) {
  const { readFileSync } = require('fs');
  const [, , jsonPath, rawPath] = process.argv;
  const json = jsonPath !== undefined ? readFileSync(jsonPath, 'utf8') : '{}';
  const raw = rawPath !== undefined ? readFileSync(rawPath, 'utf8') : undefined;
  process.stdout.write(`${formatBenchResults({ json, raw })}\n`);
}
