/**
 * Read the seed configured by Vitest for the current run.
 * Vitest stores it inside the worker global state under `config.sequence.seed`.
 * This value corresponds to what `vitest.getSeed()` returns at the node-level API.
 */
export function readVitestSeed(): number | undefined {
  try {
    const workerState: { config?: { sequence?: { seed?: number } } } | undefined = (globalThis as any)
      .__vitest_worker__;
    return workerState?.config?.sequence?.seed;
  } catch {
    return undefined;
  }
}
