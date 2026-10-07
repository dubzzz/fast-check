import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vitest';
import type { BenchFn } from 'vitest';

export function bench(name: string, fn: BenchFn): void {
  test(name, async ({ bench, task }) => {
    const resultPath = `.test-artifacts/benchmarks/${encodeURIComponent(task.fullTestName)}.json`;
    const current = bench('current', process.env.BENCH_WRITE === 'true' ? { writeResult: resultPath } : {}, fn);
    if (process.env.BENCH_COMPARE === 'true' && existsSync(join(import.meta.dirname, '../..', resultPath))) {
      await bench.compare(current, bench.from('baseline', resultPath));
    } else {
      await current.run();
    }
  });
}
