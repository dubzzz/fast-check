#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Usage: node merge-vitest-timings.mjs <input-dir> <output-file> [previous-file]
// Walks <input-dir> for *.json shard timing files, takes the max duration
// recorded for each test file across shards (since each file only runs in
// one shard, max == that shard's value), and merges with [previous-file]
// using EMA smoothing so a single noisy run doesn't dominate.

const ALPHA = 0.5; // weight for the new observation

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    console.warn(`[merge-vitest-timings] skip ${path}: ${err.message}`);
    return undefined;
  }
}

function collectShardFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectShardFiles(full));
    } else if (st.isFile() && entry.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

const [, , inputDir, outputFile, previousFile] = process.argv;
if (!inputDir || !outputFile) {
  console.error('Usage: merge-vitest-timings.mjs <input-dir> <output-file> [previous-file]');
  process.exit(1);
}

const current = {};
for (const file of collectShardFiles(inputDir)) {
  const data = readJson(file);
  if (!data || typeof data !== 'object') continue;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
    if (current[key] === undefined || value > current[key]) {
      current[key] = value;
    }
  }
}

const previous = previousFile ? readJson(previousFile) : undefined;
const merged = { ...(previous && typeof previous === 'object' ? previous : {}) };
for (const [key, value] of Object.entries(current)) {
  merged[key] = key in merged ? merged[key] * (1 - ALPHA) + value * ALPHA : value;
}

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, JSON.stringify(merged, null, 2));
console.log(
  `[merge-vitest-timings] wrote ${outputFile} (current=${Object.keys(current).length}, total=${Object.keys(merged).length})`,
);
