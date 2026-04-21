# Angle D — jazzer.js interop (docs-only reference pattern)

## Feature slug
`coverage-guided-integration`

## One-sentence pitch
Do NOT ship a dedicated `@fast-check/jazzer` package — instead, publish a documented reference pattern on the website showing how to write a ~40-line `toFuzzTarget()` adapter that turns any fast-check `Arbitrary<T>` + predicate into a jazzer.js `FuzzTarget`, so users who already run jazzer.js in their pipeline can reuse their fast-check generators without fast-check owning a cross-ecosystem dependency.

## Public surface

**None.** This is a docs-only deliverable. Zero new exports from `fast-check` or any wrapper package.

The "public surface" is a recipe in the website docs under `Fuzzing → Interop with jazzer.js`, with a copy-paste adapter that users paste into their own repo.

## Load-bearing code sketch — the `toFuzzTarget` reference adapter

```ts
// Published as a snippet in the docs. NOT shipped as a package.
// Users copy this into their own repo next to their jazzer.js config.

import fc, { type Arbitrary } from 'fast-check';

/**
 * Turn a fast-check arbitrary + predicate into a jazzer.js FuzzTarget.
 *
 * jazzer.js feeds us a `Buffer` of fuzzer-chosen bytes; we consume the first
 * four as a seed and run a single-shot fast-check property. Any thrown error
 * propagates to jazzer.js, which records a finding and persists the input.
 *
 * Replay story: the `(seed, path)` emitted by fast-check on failure is
 * printed to stderr so the user can re-run it under plain `fc.assert` for a
 * fully deterministic reproduction. jazzer.js's own corpus remains the
 * primary artifact for campaign-level replay.
 */
export function toFuzzTarget<T>(
  arbitrary: Arbitrary<T>,
  predicate: (value: T) => void | Promise<void>,
) {
  return async (data: Buffer) => {
    if (data.length < 4) return; // jazzer convention: ignore short inputs.
    const seed = data.readInt32LE(0);
    try {
      await fc.assert(fc.asyncProperty(arbitrary, predicate), {
        seed,
        numRuns: 1,
        endOnFailure: true,
      });
    } catch (err) {
      // Print the deterministic replay hint so the user can reproduce under
      // vanilla fast-check without needing jazzer.js at all.
      const maybePath = (err as { counterexamplePath?: string }).counterexamplePath;
      process.stderr.write(
        `[fast-check] replay with seed=${seed}` +
        (maybePath ? ` path="${maybePath}"` : '') + '\n',
      );
      throw err;
    }
  };
}
```

Usage in the user's repo (from the docs recipe):

```ts
// fuzz/my-target.fuzz.ts
import { toFuzzTarget } from './fast-check-jazzer-adapter';
import * as fc from 'fast-check';
import { myParser } from '../src/parser';

export const fuzz = toFuzzTarget(
  fc.string(),
  (s) => { myParser(s); /* throws on bug */ },
);
```

And the invocation, straight from jazzer.js's own README:

```sh
npx jazzer fuzz/my-target --sync
```

## Strengths
- **Zero maintenance burden** — fast-check owns no jazzer.js dependency, no version-pinning headaches, no cross-ecosystem breakage surface.
- **Immediate value** — users who already run jazzer.js can adopt fast-check generators *today* without waiting for a release.
- **Demonstrates extensibility** — the recipe is a teaching tool: it shows that any buffer-oriented fuzzer (jazzer.js, libFuzzer via Node bindings, atheris-style hybrids) can consume fast-check by seeding from the first bytes.
- **Deterministic replay is preserved** — the recipe prints `seed` (and `path` when available) to stderr, so bugs found under jazzer.js always have a plain `fc.assert` reproduction.
- **No semver cost** — no API surface, no breaking-change gate, no changeset entry.

## Weaknesses
- **Users must copy the adapter** — not a drop-in package. This is by design (the recipe evolves with jazzer.js, we don't want to pin), but it's friction.
- **Buffer-to-seed mapping is coarse** — reading four bytes as a seed means jazzer.js's coverage-guided mutation barely helps us; we're effectively re-rolling the whole property from a fresh seed per iteration. libFuzzer-style byte-level mutation only pays off when Angle C's draw-log primitives land and the adapter grows to consume bytes as `ReplayingRandom` input.
- **Discoverability** — docs recipes are easy to miss compared to a published package. Needs SEO love (a clearly-titled page and a link from the "Fuzzing" chapter).
- **No CI coverage inside fast-check** — the recipe itself isn't exercised in our test matrix, so it can rot if jazzer.js changes its API.

## Shortcuts taken (honest)
- `data.readInt32LE(0)` uses four bytes flat — realistic adapter would expose `bytesToSeed` as a helper and use the rest of the buffer as `examples: [deserialize(data.slice(4))]`.
- Error introspection via `(err as { counterexamplePath?: string })` is fragile — the actual error shape from `fc.assert` is richer; the recipe should key off `err instanceof PropertyFailure` (or equivalent) once that's exposed.
- No attempt to bridge jazzer.js's `--seed` flag through to fast-check's `seed` — one-way only (jazzer's bytes → fast-check seed), which is fine for a recipe.
- No worker-thread isolation — jazzer.js can crash the process on the first finding; the recipe accepts that as jazzer.js's documented behaviour.
- Skips TypeScript config and `tsconfig`-via-`ts-node` loader plumbing; documented separately in the recipe's setup section.
- The recipe does not demonstrate corpus reuse across `@fast-check/fuzz` (Angle B) and jazzer.js — that cross-link belongs in a later cookbook entry.

## Specialist verdicts (from prior cross-examination)
- **architecture**: none — nothing lands in our packages; architectural surface is zero.
- **performance**: none — recipe, not code we ship.
- **memory-leak**: none — recipe, not code we ship.
- **determinism**: minor — signed off once the recipe prints `seed` (and `path` when available) to stderr so every jazzer.js finding has a plain-`fc.assert` reproduction.
- **api-compatibility**: none — no API surface.
- **api-ux**: minor — wants the recipe to be cross-linked from the "Fuzzing" chapter's overview page and from the `@fast-check/fuzz` README, so users discover it naturally.
- **platform-integration**: minor — Node-only (jazzer.js is Node-only); the recipe must say so explicitly and must not appear in browser/Deno guides.
- **security**: minor — wants a one-liner in the recipe reminding users that jazzer.js runs user code in-process, same caveats as `@fast-check/fuzz`.
- **test-plan-designer**: minor — wants a tiny smoke test in a follow-up examples repo (not in `packages/fast-check`) that runs the recipe end-to-end against a planted bug, so the recipe doesn't silently rot.
- **documentation**: minor (load-bearing) — this angle IS a doc deliverable; wants the recipe shipped alongside a short "Why we don't own `@fast-check/jazzer`" rationale to pre-empt user requests.
- **pr-scope**: none — docs-only, lands in the website package alone.

## Status
refined v2 — pending green light to materialise production code.

Note: "production code" here means the website recipe + rationale page, NOT an owned `@fast-check/jazzer` package. That distinction is load-bearing for this angle — any future contributor who starts drafting a `@fast-check/jazzer` directory should be redirected to this recipe instead.
