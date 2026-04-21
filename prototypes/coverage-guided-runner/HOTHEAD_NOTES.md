# Angle B — `@fast-check/fuzz` package with sibling `fuzz()` verb (refined v2)

## Feature slug
`coverage-guided-runner`

## One-sentence pitch
Ship a brand-new `@fast-check/fuzz` package that exposes a sibling `fuzz()` verb alongside `fc.assert`, running a coverage-guided campaign on an arbitrary + predicate and — on failure — surfacing a `FuzzFinding` whose `(seed, path)` replays deterministically through the normal `fc.assert` machinery.

## Public surface (refined v2)

```ts
// @fast-check/fuzz

import type { Arbitrary, Parameters } from 'fast-check';

export interface CoverageSource {
  /** Start accumulating edge hits for the next predicate call. */
  beginIteration(): void;
  /** Stop accumulating and return the edge-set reached during the last iteration. */
  endIteration(): EdgeSet;
  /** Best-effort cleanup — detach inspector session, flush NODE_V8_COVERAGE, etc. */
  dispose(): Promise<void> | void;
}

export interface EdgeSet {
  /** Stable hash of the edges reached during the iteration. */
  readonly digest: string;
  /** True iff `other` contains at least one edge this set does not. */
  expands(other: EdgeSet): boolean;
  /** Union — folded into the campaign-wide reached-edge set. */
  union(other: EdgeSet): EdgeSet;
}

export interface FuzzParameters<T> extends Parameters<T> {
  /** Wall-clock budget for the campaign. Default: 60_000 ms. */
  timeBudgetMs?: number;
  /** Hard cap on iterations regardless of the time budget. Default: Infinity. */
  maxIterations?: number;
  /** Maximum number of seeds kept in the coverage-expanding corpus. Default: 1024. */
  maxCorpusEntries?: number;
  /** Stop early once this many consecutive iterations fail to grow the edge-set. Default: 2000. */
  coverageVariancePatience?: number;
  /** Coverage backend. Default: the inspector-backed implementation. */
  coverageSource?: CoverageSource;
  /** Emit structured campaign events (piggybacks on Angle A's observability hook). */
  onEvent?: (event: FuzzEvent) => void;
}

export interface FuzzFinding<T> {
  /** The counter-example — already shrunk by the standard fast-check shrinker. */
  readonly counterexample: T;
  /** Seed + path that regenerates `counterexample` under plain `fc.assert`. */
  readonly replay: { seed: number; path: string };
  /** The error thrown by the predicate. */
  readonly error: unknown;
  /** Campaign summary (iterations, edges reached, wall-clock). */
  readonly stats: FuzzStats;
}

export type FuzzEvent =
  | { type: 'iteration'; index: number; seed: number; newEdges: number }
  | { type: 'corpus-admit'; seed: number; digest: string }
  | { type: 'corpus-evict'; seed: number; reason: 'lru' | 'capped' }
  | { type: 'plateau'; consecutiveFlat: number }
  | { type: 'shrink-start' | 'shrink-end'; seed: number };

export interface FuzzStats {
  readonly iterations: number;
  readonly corpusSize: number;
  readonly edgesReached: number;
  readonly wallClockMs: number;
  readonly stopReason: 'found' | 'time-budget' | 'iteration-cap' | 'plateau';
}

/** Campaign runner. Resolves with a finding or with `null` when the budget is exhausted. */
export declare function fuzz<T>(
  arbitrary: Arbitrary<T>,
  predicate: (value: T) => boolean | void | Promise<boolean | void>,
  params?: FuzzParameters<T>,
): Promise<FuzzFinding<T> | null>;

/** Default coverage source — `node:inspector` Profiler.startPreciseCoverage. */
export declare function inspectorCoverageSource(options?: { callCount?: boolean }): CoverageSource;
```

Note the v2 naming: **`FuzzFinding`** (not "corpus"), **`maxCorpusEntries`** (not "corpusSize"), **`coverageVariancePatience`** (not "plateauWindow"), and **`CoverageSource`** is a pluggable interface with `inspectorCoverageSource()` as the default.

## Load-bearing code sketch — the runner loop

```ts
// @fast-check/fuzz/src/fuzz.ts (sketch — prototype hygiene intentionally bad)

import fc, { type Arbitrary } from 'fast-check';
import { inspectorCoverageSource } from './coverage/InspectorCoverageSource';
import { Corpus } from './Corpus';

export async function fuzz<T>(
  arbitrary: Arbitrary<T>,
  predicate: (value: T) => boolean | void | Promise<boolean | void>,
  params: FuzzParameters<T> = {},
): Promise<FuzzFinding<T> | null> {
  const timeBudgetMs = params.timeBudgetMs ?? 60_000;
  const maxIterations = params.maxIterations ?? Number.POSITIVE_INFINITY;
  const maxCorpusEntries = params.maxCorpusEntries ?? 1024;
  const patience = params.coverageVariancePatience ?? 2000;
  const source = params.coverageSource ?? inspectorCoverageSource();
  const emit = params.onEvent ?? (() => {});

  const corpus = new Corpus(maxCorpusEntries);
  const startedAt = Date.now();
  let iterations = 0;
  let flat = 0;

  try {
    while (iterations < maxIterations && Date.now() - startedAt < timeBudgetMs) {
      // Pick next seed: either a fresh one or a mutation of a corpus entry.
      const seed = corpus.isEmpty() || Math.random() < 0.25
        ? (Math.random() * 2 ** 31) | 0
        : corpus.sampleSeedWithEnergyBias();

      source.beginIteration();
      let value!: T;
      let error: unknown = undefined;
      try {
        // Single-shot run via the public runner — reuses path/replay semantics.
        const res = await fc.check(fc.asyncProperty(arbitrary, predicate), {
          seed,
          numRuns: 1,
          endOnFailure: true,
        });
        if (res.failed) {
          error = res.error;
          value = res.counterexample![0];
        }
      } finally {
        var edges = source.endIteration();
      }

      iterations += 1;

      if (error !== undefined) {
        emit({ type: 'shrink-start', seed });
        // Deep shrink with the standard machinery — deterministic replay from (seed, path).
        const shrunk = await fc.check(fc.asyncProperty(arbitrary, predicate), {
          seed,
          endOnFailure: false,
        });
        emit({ type: 'shrink-end', seed });
        return {
          counterexample: shrunk.counterexample![0] as T,
          replay: { seed, path: shrunk.counterexamplePath! },
          error,
          stats: statsOf(iterations, corpus, startedAt, 'found'),
        };
      }

      if (corpus.admitIfExpands(seed, edges)) {
        emit({ type: 'corpus-admit', seed, digest: edges.digest });
        flat = 0;
      } else {
        flat += 1;
      }

      emit({ type: 'iteration', index: iterations, seed, newEdges: corpus.lastNewEdges });

      if (flat >= patience) {
        emit({ type: 'plateau', consecutiveFlat: flat });
        return null;
      }
    }
    return null;
  } finally {
    await source.dispose();
  }
}
```

The key load-bearing invariant: `seed` is the single source of truth for replay. We deliberately do **not** try to capture the draw log here — that is Angle C's territory. When a seed reveals a bug, the standard `fc.check` replay shrinks it, so every `FuzzFinding.replay` is a vanilla fast-check replay.

## Strengths
- **Clean surface** — `fuzz()` is a verb parallel to `fc.assert`; users don't have to learn a new concept to opt in.
- **Non-breaking** — new package, zero churn to `packages/fast-check`. Core only needs Angle A's observability hook.
- **Pluggable coverage** — `CoverageSource` lets us ship the `node:inspector` default and let the community write istanbul / c8 / jazzer.js adapters without a fast-check release.
- **Deterministic findings** — `FuzzFinding.replay` is a plain `(seed, path)` that re-runs under `fc.assert` unchanged. Matches the user's confirmed determinism budget.
- **Budgeted** — every knob a fuzzing campaign needs (`timeBudgetMs`, `maxIterations`, `maxCorpusEntries`, `coverageVariancePatience`) is explicit and has a safe default.
- **Observability-friendly** — `onEvent` is plain JSON, cross-process transferable, ready for `@fast-check/worker`.

## Weaknesses
- **Mutation is coarse** — without Angle C's draw-log, "mutation" is essentially seed-reseeding with a corpus LRU. libFuzzer-style bit-flipping of individual draws is not reachable from this angle alone.
- **Inspector session has a real startup cost** — ~20–80ms to attach; amortised across the campaign, but noticeable on tiny predicates. Mitigation: keep the session alive for the whole campaign, not per-iteration.
- **Corpus persistence is out of scope for v1** — every campaign starts cold. Users who want cross-run corpus reuse will need to serialize/restore themselves.
- **Energy-biased seed sampling is hand-wavy** in the sketch — real impl needs a proper schedule (e.g. AFL's `calculate_score`).
- **No mid-run feedback** — because we stick to seed granularity, we can't reward a partial draw that just reached a new branch.

## Shortcuts taken (honest)
- `Corpus.sampleSeedWithEnergyBias()` is a stub — prototype returns a uniformly random corpus entry.
- `inspectorCoverageSource()` prototype uses a global `Profiler` singleton; real impl needs lifecycle scoping.
- `edges.digest` uses a naive `JSON.stringify(...)` over sorted edge IDs — production needs xxhash64 or similar.
- The sketch re-enters `fc.check` twice per failing iteration (once to detect, once to shrink). Real impl should thread the existing `Tosser` directly to avoid double generation.
- No handling of async predicate timeouts beyond what `fc.asyncProperty` already provides.
- No persistent corpus file format; corpus evaporates when the process ends.
- `Math.random()` for mutation-vs-fresh coin flip — real impl should seed its scheduler from a campaign-level master seed so that campaigns themselves are reproducible end-to-end.

## Specialist verdicts (from prior cross-examination)
- **architecture**: minor — package boundary is clean, `CoverageSource` seam is the right abstraction; wants a short ADR before code lands.
- **performance**: minor — inspector cost is tolerable once the session is long-lived; wants a perf budget doc per iteration (<5ms coverage overhead target).
- **memory-leak**: minor — corpus is LRU-capped (`maxCorpusEntries`); wants an explicit test that `dispose()` drops the inspector session and that the corpus releases references on evict.
- **determinism**: minor — `FuzzFinding.replay` is plain `(seed, path)`, satisfying the confirmed determinism budget; wants an e2e test that the replay reproduces under `fc.assert` in a fresh process.
- **api-compatibility**: none — new package, no impact on core's semver.
- **api-ux**: minor — likes the `fuzz()` verb; wants `FuzzParameters` to extend `Parameters<T>` (already does) and wants a `fuzz.dry(...)` helper in v1.1 for reproducing findings without the coverage backend.
- **platform-integration**: minor — Node-only for v1 is fine; wants a clear `"engines.node": ">=18"` and an explicit "browser: false" export condition.
- **security**: minor — inspector attach must fail closed when `NODE_OPTIONS` disables it; wants a note that user code runs in-process and so this is a testing-only package, never to be shipped in prod bundles.
- **test-plan-designer**: minor — unit-testable via a fake `CoverageSource`; wants golden-corpus fixtures for a handful of toy targets.
- **documentation**: minor — needs a "Fuzzing" chapter in the website and a migration recipe from `vitest --fuzz` (#5845).
- **pr-scope**: minor — will land in two PRs (core observability hook in `fast-check`, then `@fast-check/fuzz`). Justified multi-package split.

## Status
refined v2 — pending green light to materialise production code.
