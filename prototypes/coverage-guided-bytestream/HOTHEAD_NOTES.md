# Angle C — Draw-log record / replay primitives (refined v2)

## Feature slug
`coverage-guided-bytestream`

## One-sentence pitch
Expose two narrow primitives from core — `recordDrawLog()` and `replayDrawLog()` — that capture every primitive integer draw made during a generation and let a driver replay a value from that byte-addressable log, unlocking libFuzzer-style bit-flip mutation while keeping the canonical `(seed, path)` replay untouched for production findings.

## Public surface (refined v2)

```ts
// fast-check — new @public symbols, land behind a feature flag for one minor.

/**
 * Opaque, structured transcript of every `Random`-level draw performed while
 * generating a single value. Cheap to serialise (plain JSON), forward-
 * compatible (versioned header), byte-addressable for mutation.
 */
export interface DrawLog {
  readonly version: 1;
  readonly entries: ReadonlyArray<DrawLogEntry>;
}

export type DrawLogEntry =
  | { kind: 'int'; min: number; max: number; value: number }
  | { kind: 'bigint'; min: string; max: string; value: string }
  | { kind: 'bool'; value: boolean };

/**
 * Run `generator` while recording every primitive draw. Returns the generated
 * value alongside the transcript. Determinism: the generated value is
 * byte-identical to a plain `arb.generate(mrng)` call with the same mrng.
 */
export declare function recordDrawLog<T>(
  arbitrary: Arbitrary<T>,
  mrng: Random,
  biasFactor?: number,
): { value: Value<T>; log: DrawLog };

/**
 * Replay `arbitrary` by feeding pre-recorded draws back through a synthetic
 * `Random`. When the log is exhausted, `fallback` supplies fresh draws so
 * that a mutated / truncated log still produces *some* value.
 *
 * Returns `{ value, consumed }` where `consumed` is the number of log
 * entries actually read. Callers doing bit-flip mutation use `consumed` to
 * decide which region of the log was "live" for this generation.
 */
export declare function replayDrawLog<T>(
  arbitrary: Arbitrary<T>,
  log: DrawLog,
  fallback: Random,
): { value: Value<T>; consumed: number };
```

Key v2 naming: **split into two verbs** (`recordDrawLog` + `replayDrawLog`) rather than a single `DrawLog` class, and the log is a **pure data structure** not an opaque handle — external drivers can mutate it freely.

## Load-bearing code sketch — the `ReplayingRandom`

```ts
// prototypes/coverage-guided-bytestream/src/ReplayingRandom.ts (sketch)

import type { Random } from 'fast-check/internal'; // hypothetical re-export
import type { DrawLog, DrawLogEntry } from './DrawLog';

/**
 * A `Random` shim that serves pre-recorded draws from a log, falling back to
 * a real `Random` when the log is exhausted or when a range mismatch makes
 * the logged value illegal under the current bounds.
 */
export class ReplayingRandom {
  private cursor = 0;

  constructor(
    private readonly log: DrawLog,
    private readonly fallback: Random,
  ) {}

  get consumed(): number { return this.cursor; }

  nextInt(min: number, max: number): number {
    const entry = this.log.entries[this.cursor];
    if (entry !== undefined && entry.kind === 'int' && this.inRange(entry.value, min, max)) {
      this.cursor += 1;
      return entry.value;
    }
    // Mismatch — log was mutated out of shape. Fall back to fresh draw.
    return this.fallback.nextInt(min, max);
  }

  nextBigInt(min: bigint, max: bigint): bigint {
    const entry = this.log.entries[this.cursor];
    if (entry !== undefined && entry.kind === 'bigint') {
      const v = BigInt(entry.value);
      if (v >= min && v <= max) { this.cursor += 1; return v; }
    }
    return this.fallback.nextBigInt(min, max);
  }

  nextBoolean(): boolean {
    const entry = this.log.entries[this.cursor];
    if (entry !== undefined && entry.kind === 'bool') {
      this.cursor += 1;
      return entry.value;
    }
    return this.fallback.nextBoolean();
  }

  // `clone`, `jump`, etc. delegate to `fallback` unchanged — we never rewrite
  // the logged values, only consume them in order.
  clone(): Random { return this.fallback.clone(); }

  private inRange(v: number, min: number, max: number): boolean {
    return Number.isInteger(v) && v >= min && v <= max;
  }
}
```

And the public verbs wire it in:

```ts
// prototypes/coverage-guided-bytestream/src/recordDrawLog.ts (sketch)

export function recordDrawLog<T>(
  arbitrary: Arbitrary<T>,
  mrng: Random,
  biasFactor?: number,
): { value: Value<T>; log: DrawLog } {
  const entries: DrawLogEntry[] = [];
  const recorder = wrapRandom(mrng, {
    onInt: (min, max, value) => entries.push({ kind: 'int', min, max, value }),
    onBigInt: (min, max, value) =>
      entries.push({ kind: 'bigint', min: String(min), max: String(max), value: String(value) }),
    onBool: (value) => entries.push({ kind: 'bool', value }),
  });
  const value = arbitrary.generate(recorder, biasFactor);
  return { value, log: { version: 1, entries } };
}

export function replayDrawLog<T>(
  arbitrary: Arbitrary<T>,
  log: DrawLog,
  fallback: Random,
): { value: Value<T>; consumed: number } {
  const replaying = new ReplayingRandom(log, fallback) as unknown as Random;
  const value = arbitrary.generate(replaying);
  return { value, consumed: (replaying as unknown as ReplayingRandom).consumed };
}
```

## Strengths
- **Unlocks real mutation** — drivers can slice, mutate, splice, bit-flip the log and replay. This is the one angle that gets us close to libFuzzer-grade input evolution.
- **Deterministic by construction** — `recordDrawLog(arb, mrng)` produces the exact value `arb.generate(mrng)` would have produced, same path, same shrink context. Adding the log is pure observation.
- **Forward-compatible envelope** — `version: 1` header means we can extend `DrawLogEntry` (e.g. add a `{ kind: 'float' }` variant) without breaking stored corpora.
- **Small surface** — two functions plus a data type. No new subsystem.
- **Orthogonal to Angle B** — `@fast-check/fuzz` can consume these primitives when they land; it doesn't depend on them for v1.

## Weaknesses
- **Every arbitrary must flow through `Random`** — which is already the convention, but any future arbitrary that skips `Random` (e.g. reads `crypto.randomBytes` directly) would silently fail to record. Needs a lint / audit.
- **Range-mismatch fallback is a landmine** — if a mutated log feeds an `int(0, 255)` value into a call expecting `int(0, 1)`, we silently fall back. Good for robustness, bad for reproducibility of the mutation's *intent*. Needs a diagnostic mode.
- **Bigint-as-string is ugly** — necessary for JSON portability but awkward.
- **Shrink context is not in the log** — replaying gets a fresh shrink context from `arbitrary.generate`, which is correct but means the log alone cannot replay a *shrunk* value, only the pre-shrink generation.
- **Serialisation size** — a deeply nested record generates a long log. For corpora of 10k+ entries this matters; compression is the driver's problem.

## Shortcuts taken (honest)
- `wrapRandom` is hand-waved — real impl needs to intercept every method on `Random`, including ones the prototype doesn't bother with (`nextArrayInt`, `nextDouble`).
- Prototype uses a JS class for `ReplayingRandom` and casts through `unknown` — real impl should extend / proxy the actual `Random` class so `instanceof` checks pass.
- No `{ kind: 'float' }` / `{ kind: 'double' }` variants in the prototype; `double()` decomposes into ints via pure-rand, so the current two variants technically cover it — but an explicit float variant would make logs more legible.
- No diagnostic mode for range-mismatch fallback — production should emit a structured event when a mismatch is fielded.
- Log entries duplicate `min` / `max` on every row; a production encoder would dedupe a range dictionary.
- No streaming — whole log is held in memory. Fine for v1, not fine for megabyte-scale inputs.
- `recordDrawLog` doesn't record `biasFactor` — replay assumes the caller passes the same bias. Should be in the envelope.

## Specialist verdicts (from prior cross-examination)
- **architecture**: minor — primitives are narrow and well-scoped; wants a dedicated `@internal` boundary between `Random` and user-visible `DrawLog`, and an ADR covering the envelope versioning policy.
- **performance**: minor — recording adds one array push per primitive draw; measurable (~3–7%) on generation-heavy paths, negligible on realistic predicates. Wants recording to be opt-in, never on by default.
- **memory-leak**: minor — logs retain numbers only, no object refs; wants a test that `ReplayingRandom` releases its reference to the log once `consumed === entries.length`.
- **determinism**: minor (load-bearing) — signed off that `recordDrawLog(arb, mrng)` produces the byte-identical value of `arb.generate(mrng)`; wants a property test that asserts this across every public arbitrary.
- **api-compatibility**: minor — the two verbs are additive; `DrawLog` envelope versioning is explicit. No existing surface touched.
- **api-ux**: minor — likes the verb split over a single `DrawLog` class; wants a short cookbook entry showing `record → mutate → replay` end to end.
- **platform-integration**: none — pure data + pure TS, no platform hooks.
- **security**: minor — logs are serialisable user-supplied data; wants explicit docs that `replayDrawLog` MUST NOT `eval` anything (it doesn't) and that consumers must treat logs as untrusted input.
- **test-plan-designer**: minor — asks for the shared-assertion suite to gain an `assertRecordAndReplayProduceSameValue` helper, and for a fuzz-the-fuzzer test that mutates logs and checks nothing throws.
- **documentation**: minor — needs a "Mutable corpora" advanced chapter; not required for the v1 of `@fast-check/fuzz`.
- **pr-scope**: minor — this is a core-only change; lands independently of Angle B. Justified single-package PR.

## Status
refined v2 — pending green light to materialise production code.
