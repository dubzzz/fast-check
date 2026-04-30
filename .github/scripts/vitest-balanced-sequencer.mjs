import { BaseSequencer } from 'vitest/node';
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

// Custom sequencer that distributes test files across shards using a
// Longest-Processing-Time-first (LPT) bin packing on per-file durations
// from a previous run. Falls back to the default index-based shard when
// no timings file is available so the very first run still works.
//
// Activation: set VITEST_TIMINGS_FILE to a JSON file mapping
// `${projectName}:${relativePath}` to a duration in milliseconds.
export class BalancedSequencer extends BaseSequencer {
  async shard(files) {
    const { config } = this.ctx;
    const shard = config.shard;
    if (!shard) return files;

    const timings = loadTimings(process.env.VITEST_TIMINGS_FILE);
    if (!timings) return super.shard(files);

    const known = Object.values(timings).filter((v) => typeof v === 'number' && v >= 0);
    if (known.length === 0) return super.shard(files);
    const fallback = known.reduce((s, v) => s + v, 0) / known.length;

    const annotated = files.map((spec) => {
      const key = specKey(spec);
      const duration = typeof timings[key] === 'number' ? timings[key] : fallback;
      return { spec, key, duration };
    });

    // LPT: sort by duration desc, tiebreak by key for determinism.
    annotated.sort((a, b) => b.duration - a.duration || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

    const bins = Array.from({ length: shard.count }, () => ({ total: 0, items: [] }));
    for (const item of annotated) {
      let best = 0;
      for (let i = 1; i < bins.length; i++) {
        if (bins[i].total < bins[best].total) best = i;
      }
      bins[best].total += item.duration;
      bins[best].items.push(item);
    }

    return bins[shard.index - 1].items.map(({ spec }) => spec);
  }
}

export function specKey(spec) {
  const root = spec.project.config.root;
  const projectName = spec.project.name || '';
  const rel = relative(root, spec.moduleId).split('\\').join('/');
  return `${projectName}:${rel}`;
}

function loadTimings(path) {
  if (!path || !existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
}
