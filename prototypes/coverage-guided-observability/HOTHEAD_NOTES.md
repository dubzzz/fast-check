# Angle A — Observability hook (sprint hothead, haiku-tier)

## Feature slug
`coverage-guided-observability`

## One-sentence pitch
Ship the smallest possible surface in core — a `fc.observe({ onDraw, onRun, onShrink })` registration point that streams structured events — and let an external driver (under `prototypes/coverage-guided-observability/driver/`) own the AFL-style loop using `NODE_V8_COVERAGE`.

## Public surface added (core)
- `fc.observe(listener: ObservabilityListener): () => void` — returns an unsubscribe fn.
- `ObservabilityListener = { onDraw?, onRunStart?, onRunEnd?, onShrink? }`.
- A new runner parameter `observability?: boolean` (opt-in, defaults to `false`) that gates emission. When off, the emitter fast-paths to a no-op singleton — zero branching cost in `fc.assert`'s tight loop beyond a single boolean check in `Tosser.toss`.

## What the driver does (external, not in core)
1. Spawns the user's test command with `NODE_V8_COVERAGE=./cov-pool` per iteration.
2. Reads V8's JSON coverage dumps after each run.
3. Diffs coverage edges reached vs. the corpus-so-far.
4. Keeps the `(seed, path)` of inputs that expanded coverage into a corpus.
5. Mutates by changing the seed, or by using `examples: [...]` with serialized past inputs, or by asking the arbitrary to shrink from a near-miss.

## Strengths
- **Minimal core change** — one subscription surface, no new runner, no dep churn. Backport-safe.
- **Browser-safe by construction** — core has zero coverage knowledge; browser users simply never subscribe.
- **Zero-cost-when-off** — guarded by `observability` flag; one boolean branch in `Tosser`.
- **Decoupled evolution** — competing coverage sources (V8, c8, istanbul, jazzer.js trace) can ship as separate OSS packages without waiting on fast-check releases.
- **Plays well with `@fast-check/worker`** — events are plain JSON, cross-process transferable.

## Weaknesses
- **Naive mutation** — driver has no access to fast-check's internal draw log, so mutation has to happen at the `(seed, examples[])` granularity, which is coarse vs. AFL-level bit-flipping.
- **Per-run V8 snapshot cost is real** — ~1–5ms per run depending on program size; dominates generation for tiny predicates. Driver must batch runs.
- **Determinism story shifts to the driver** — fast-check still replays from `(seed, path)`, but the driver's *selection* of which seed to run next is non-deterministic unless the driver itself seeds its scheduler.
- **No mid-run feedback** — hit-count per `nextInt` call isn't usable; coverage is per-run only. This rules out the per-draw energy feedback that libFuzzer does so well.
- **Burden on users** — they must wire the driver themselves. Most users won't. Adoption curve is steep.

## Example sketch (runner side — core)
See `src/ObservabilityHook.ts` for the surface shape.

## Example sketch (driver side — external)
See `driver/CoverageDriver.ts` for the AFL-style loop that consumes events + V8 coverage.

## Shortcuts taken (honest)
- Prototype emits events synchronously; real impl should buffer into a ring to amortise V8 deopts.
- `onDraw` receives the arbitrary label only by string, not by identity — refinement needed.
- No backpressure: a slow subscriber blocks the runner. Real impl needs async queue.
- V8 coverage parse uses JSON.parse on the whole dump every run; libFuzzer would maintain a persistent edge-set across runs.
