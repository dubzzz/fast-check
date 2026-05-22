---
name: js-perf-recipes
description: A recipe book of JavaScript micro-optimization techniques distilled from real ⚡️ optimization PRs landed in the `dubzzz/pure-rand` repo over the project's lifetime. Each recipe describes a generalizable pattern, the JIT/engine reason it works, a before/after snippet, and (where reported) a quantified speedup. Apply these when working on hot paths: PRNGs, hashes, parsers, numeric kernels, anything inside a tight loop.
---

> **⚠️ Scope:** Micro-optimization of hot paths in plain JS/TS. Not a substitute for picking a better algorithm.
>
> **🎯 Mindset:**
> 1. Measure first — never guess. Several of these recipes come from PRs that were *closed* because the benchmark didn't hold up (see _Negative results_ at the bottom).
> 2. Benchmark across the full input distribution — a win at one size can be a loss at another.
> 3. Set a minimum effect threshold (e.g. >5%) before merging — micro-benchmark noise routinely fakes 10-40% wins.
> 4. The cheapest operation is the one you delete.

---

## 1. Mutation over allocation

The single biggest source of wins. JavaScript objects, tuples, and arrays are not free: every allocation is a hidden-class lookup, a GC root, and a potential cache miss. Hot paths that look like `state = state.step()` or `return [value, newState]` allocate _per step_ — and "per step" usually means "per iteration of a 2^N loop somewhere".

**✅ Do** add a private/unsafe mutating primitive to immutable types, and make the immutable API a thin wrapper.

```ts
// Pattern
class Foo {
  // public immutable contract
  step(): [number, Foo] {
    const next = this.clone();
    const out = next.unsafeStep();
    return [out, next];
  }
  // private mutating primitive (the actual work)
  private unsafeStep(): number {
    /* mutate this.* in place */
    return out;
  }
}
```

**✅ Do** switch state fields from `readonly` to `private` so the mutating primitive can update them while the public contract still looks immutable.

**✅ Do** in N-step loops (`skipN`, `generateN`, `jump`, fold, scan), **clone once outside the loop and mutate N times inside**. This reduces allocations from `O(N)` to `O(1)`.

```ts
// Before — O(N) allocations
let cur = rng;
for (let i = 0; i !== num; ++i) {
  const next = cur.next();
  out.push(next[0]);
  cur = next[1];                 // new RNG instance per iteration
}

// After — O(1) allocation
const next = rng.clone();
for (let i = 0; i !== num; ++i) {
  out.push(next.unsafeStep());   // mutate in place
}
```
Sources: [pure-rand#231](https://github.com/dubzzz/pure-rand/pull/231), [#232](https://github.com/dubzzz/pure-rand/pull/232), [#251](https://github.com/dubzzz/pure-rand/pull/251).

**✅ Do** drop tuple returns from internals. If the function mutates state in place, return the raw value, not `[value, state]`.

**✅ Do** audit the tail of a function: if you `return new Klass(a, b, c)` from computed values, mutate a working instance you already have and `return` that instead.
Source: [pure-rand#239](https://github.com/dubzzz/pure-rand/pull/239).

**✅ Do** introduce the unsafe variant _and_ a follow-up PR that rewires the library's own internal callers to use it. The optimization is only half-banked until the internals consume it.
Sources: [pure-rand#247](https://github.com/dubzzz/pure-rand/pull/247), [#248](https://github.com/dubzzz/pure-rand/pull/248), [#249](https://github.com/dubzzz/pure-rand/pull/249), [#250](https://github.com/dubzzz/pure-rand/pull/250), [#252](https://github.com/dubzzz/pure-rand/pull/252).

**✅ Do** apply "mutate in place, clone at the boundary" to large array buffers. If a hot helper does `arr.slice()` then mutates, push the `slice()` to the public `clone()` method instead.

```ts
// Before — slice on every twist
function twist(prev: number[]): number[] {
  const mt = prev.slice();
  for (let i = 0; i < N; ++i) { /* mutate mt */ }
  return mt;
}

// After — mutate in place; slice only at the immutability boundary
function twist(mt: number[]) {
  for (let i = 0; i < N; ++i) { /* mutate mt */ }
}
clone() { return new MT(this.states.slice(), this.index); }
```
Source: [pure-rand#948](https://github.com/dubzzz/pure-rand/pull/948) — ~37k vs ~34k Hz on 5000 calls.

---

## 2. Stay in int32 land (bitwise > arithmetic)

V8 and JSC represent integers internally as Smi/int32 _as long as the operations preserve that shape_. The moment you do something that could overflow into a double, you pay a representation tag, allocation, and lose the ability to inline.

**✅ Do** use `Math.imul(a, b)` for 32-bit integer multiplication whenever you only need the low 32 bits (LCGs, MurmurHash, xxHash, FNV, Mersenne tempering).

```ts
// Before — products can exceed 2^53, engine can't safely keep int32
return (seed * MULTIPLIER + INCREMENT) & MASK;

// After — guaranteed low-32-bit multiply; one CPU `imul` instruction
return (Math.imul(seed, MULTIPLIER) + INCREMENT) & MASK;
```
Source: [pure-rand#958](https://github.com/dubzzz/pure-rand/pull/958) — congruential32 became 1.14× faster than `Math.random` and 1.88× faster than xorshift128plus.

**✅ Do** use bitwise `|` instead of `+` when combining two values masked to disjoint bit ranges.

```ts
// Before — '+' has to consider carry / float fallback
const y = (mt[idx] & MASK_UPPER) + (mt[idx + 1] & MASK_LOWER);

// After — '|' is a pure int32 op
const y = (mt[idx] & MASK_UPPER) | (mt[idx + 1] & MASK_LOWER);
```
Source: [pure-rand#951](https://github.com/dubzzz/pure-rand/pull/951) — **1.46× faster** twist (~12.8k → ~18.6k Hz).

**✅ Do** use `~~(a / b)` rather than `Math.floor(a / b)` when `a` and `b` are non-negative int32. `~~` truncates to int32 and stays in the fast representation.

**✅ Do** replace `D - (D % k)` with `~~(D / k) * k` when `D` is a constant. The bitwise truncation specializes to int32; the subtract-of-modulo doesn't.

```ts
// Before
const MaxAllowed = NumValues - (NumValues % rangeSize);

// After (guard for the trivial case)
const MaxAllowed = rangeSize > 2
  ? ~~(0x100000000 / rangeSize) * rangeSize
  : 0x100000000;
```
Source: [pure-rand#516](https://github.com/dubzzz/pure-rand/pull/516) — ~1.2× on small ranges.

**✅ Do** prefer **adding a literal** to **subtracting a named constant** for domain re-centering. The literal folds as an immediate; the named constant goes through a property load.

```ts
// Before
let v = rng.unsafeNext() - MinRng;   // MinRng = -0x80000000

// After
let v = rng.unsafeNext() + 0x80000000;
```
Source: [pure-rand#516](https://github.com/dubzzz/pure-rand/pull/516).

**✅ Do** move int32↔uint32 coercion **out of the producer** and into the API contract. The cheapest `>>> 0` or `| 0` is the one you delete.

```ts
// Before — every call pays for the unsigned conversion
next(): number { return y >>> 0; }
static readonly min = 0;
static readonly max = 0xffffffff;

// After — advertise the native signed range; callers convert only if they need uint32
next(): number { return y; }
static readonly min = -0x80000000;
static readonly max =  0x7fffffff;
```
Sources: [pure-rand#510](https://github.com/dubzzz/pure-rand/pull/510), [#512](https://github.com/dubzzz/pure-rand/pull/512).

---

## 3. BigInt is expensive — use it only where Number cannot

BigInt arithmetic is materially slower than Number arithmetic on every engine. Treat BigInt like a foreign type you cross to only when necessary.

**❌ Don't** use `bigint` for loop counters, iteration indexes, small intermediates. If a value is provably bounded by `2^53`, demote it to `number`.

```ts
// Before
let n = SBigInt(1);
for (let i = SBigInt(0); i !== n; ++i) { /* ... */ }

// After
let n = 1;
for (let i = 0; i !== n; ++i) { /* ... */ }
```
Source: [pure-rand#517](https://github.com/dubzzz/pure-rand/pull/517).

**✅ Do** prefer bit shifts to multiplies on BigInt — the speedup is larger than for Number because the engine can implement `<< 32n` as a word-shift, but `* 0x100000000n` must go through a general multiply.

```ts
// Before
value = NumValues * value + SBigInt(out) - MinRng;

// After  (NumValues = 1n << 32n)
value = (value << ThirtyTwo) + SBigInt(out + 0x80000000);
```
Source: [pure-rand#757](https://github.com/dubzzz/pure-rand/pull/757).

**✅ Do** stay in the cheap numeric domain as long as possible — do the `+ 0x80000000` re-centering on the Number side, _then_ lift to BigInt. One BigInt construction instead of two-plus-a-subtraction.
Source: [pure-rand#757](https://github.com/dubzzz/pure-rand/pull/757) — combined +32–65% across uniform BigInt distributions.

**⚠️ Caution** delegating to native BigInt is not unconditionally a win: on small-range inputs the BigInt setup cost can dominate. A PR that did exactly this ([#857](https://github.com/dubzzz/pure-rand/pull/857)) was 6.31× faster on `[0, 2^40-1]` but regressed smaller ranges — and was rejected. **Benchmark across input sizes.**

---

## 4. Hoist invariants, precompute constants

Anything that doesn't change should run once, not once-per-call.

**✅ Do** hoist module-scope BigInt / RegExp / Date / Map literals to the top of the file so they're allocated at import, not per call.

```ts
// Before — re-created on every call
function f() {
  const NumValues = SBigInt(0x100000000);
  // ...
}

// After — once per module
const NumValues: bigint = typeof BigInt !== 'undefined' ? BigInt(0x100000000) : undefined!;
function f() { /* uses NumValues */ }
```
Source: [pure-rand#757](https://github.com/dubzzz/pure-rand/pull/757).

**✅ Do** constant-fold by hand at module scope. `1 << 24`, `2 ** -53`, `(1 << 27) - 1` all run on every import; for libraries with many consumers this adds up. Replace the RHS with the computed literal, keep the formula as a comment.

```ts
// Before
const divisor = 1 << 24;
const scale = 1 / divisor;
const mask = divisor - 1;

// After
const scale = 5.960464477539063e-8; // 1 / (1 << 24)
const mask = 16777215;              // (1 << 24) - 1
```
Source: [pure-rand#959](https://github.com/dubzzz/pure-rand/pull/959).

**✅ Do** hoist repeated property/array reads into a local. The JIT generally can't prove that `this.states[this.index]` is unchanged between statements (some side effect _could_ have mutated it), so it re-loads. A `const` read is a register/stack access.

```ts
// Before — two indexings, second unnecessary
let y = this.states[this.index];
y ^= this.states[this.index] >>> U;

// After
let y = this.states[this.index];
y ^= y >>> U;
```
Source: [pure-rand#894](https://github.com/dubzzz/pure-rand/pull/894).

---

## 5. Loop and branch shape

The JIT optimizes loops whose shape it can see. Rejection-sampling and rare-fallback loops benefit from being rewritten so the steady state has no branches.

**✅ Do** rewrite `while (true) { v = step(); if (accept(v)) return f(v); }` as **eager-compute-then-loop-on-rejection**. Removes the unconditional branch and the `if/break` from the steady state, and makes loop bounds visible to the JIT.

```ts
// Before
while (true) {
  const out = rng.unsafeNext();
  const dv = out - MinRng;
  if (dv < MaxAllowed) return dv % rangeSize;
}

// After
let dv = rng.unsafeNext() - MinRng;
while (dv >= MaxAllowed) {
  dv = rng.unsafeNext() - MinRng;
}
return dv % rangeSize;
```
Source: [pure-rand#507](https://github.com/dubzzz/pure-rand/pull/507) — modest direct win, but it sets up further optimizations (#516).

**✅ Do** order branches by **frequency × cost**: cheapest probable case first, expensive fallback last. Defer divisions/modulos until you've proven they're necessary.

```ts
// Before — always computes MaxAllowed (a division) and always runs `% rangeSize`
const MaxAllowed = ~~(0x100000000 / rangeSize) * rangeSize;
let v = rng.next() + 0x80000000;
while (v >= MaxAllowed) v = rng.next() + 0x80000000;
return v % rangeSize;

// After — two fast paths
let v = rng.next() + 0x80000000;
if (v < rangeSize) return v;                       // no modulo at all
if (v + rangeSize < 0x100000000) return v % rangeSize; // modulo, no rejection setup
const MaxAllowed = 0x100000000 - (0x100000000 % rangeSize);
while (v >= MaxAllowed) v = rng.next() + 0x80000000;
return v % rangeSize;
```
Source: [pure-rand#858](https://github.com/dubzzz/pure-rand/pull/858) — note this one was closed as inconclusive; see _Negative results_.

**✅ Do** unroll a loop manually when the bound is in practice always the same small constant (2, 3, 4). Removes counter, bounds check, and per-iteration branches; lets the JIT keep values in registers.

```ts
// Before — generic, variable-length
for (let i = 0; i !== rangeLength; ++i) {
  const maxI = i === 0 ? rangeSize[0] + 1 : 0x100000000;
  out[i] = uniformIntInternal(rng, maxI);
}

// After — unrolled to the always-2 case
const max0 = rangeSize[0] + 1;
out[0] = uniformIntInternal(rng, max0);
out[1] = uniformIntInternal(rng, 0x100000000);
```
Source: [pure-rand#869](https://github.com/dubzzz/pure-rand/pull/869) — **up to 2.74×** on large ranges.

**✅ Do** extract the inner step of a rejection loop into a named helper so the initial call and the retry share one code path (better for the JIT, clearer for readers).

---

## 6. Compact constant data with packed strings

Large constant lookup tables compiled into JS source are huge: each number in `[1927166307, 3044056772, /* ... */]` takes ~11 bytes of source and a numeric slot.

**✅ Do** encode bit/byte data as ASCII strings (each char carries 6–7 bits in a safe printable range, no backslash escapes). Decode with `charCodeAt` — O(1), cheap enough to absorb in most loops, and the parser/minifier compresses strings far better than number arrays.

```ts
// Before — 624 uint32s, large bundle, slow parse
const JUMP_COEFS = [1927166307, 3044056772, /* ...622 more */];
if (JUMP_COEFS[i >>> 5] & (1 << (i & 0x1f))) { /* ... */ }

// After — base-64-ish packed string, ~30% smaller
const JUMP_COEFS = 'SUSgbA\\W`E[]KN2RUSo8XVU?HKBFRl11E\\KoWOg5B…';
if ((JUMP_COEFS.charCodeAt((i / 6) | 0) - 48) & (1 << (i % 6))) { /* ... */ }
```
Source: [pure-rand#970](https://github.com/dubzzz/pure-rand/pull/970) — Mersenne module shrank from 11.9 kB → 8.4 kB; full bundle −12.8%. Note the trade-off: isolated `jump()` was ~2.8% slower, but bulk runs were indistinguishable. Use this recipe when **bundle size matters and the table is touched rarely** (init, jump, lookup-once-per-N-calls).

**✅ Do** lift the per-word decode out of the inner loop when the decode is hot — decode once per 6 bits, not once per bit.

---

## 7. Negative results & cautionary tales

These PRs were **closed without merging**. The recipe here is _when not to optimize_ — and how to recognize a benchmark you shouldn't trust.

**⚠️ "Looked faster, didn't survive replication."**
[pure-rand#858](https://github.com/dubzzz/pure-rand/pull/858) showed ~1.4× across all measured sizes, but the author labelled it "not conclusive" and closed it. A ~1.4× single-run delta is well within micro-benchmark noise. **Repeat your benchmark across machines / time-of-day / Node versions before merging.**

**⚠️ "Win at one input size, regression at others."**
[pure-rand#857](https://github.com/dubzzz/pure-rand/pull/857) delivered 6.3× at `[0, 2^40-1]` by delegating to native BigInt, but regressed smaller ranges. **Benchmark a representative spread of inputs — the cross-over point matters.**

**⚠️ "Barely invisible win, but enabling refactor."**
[pure-rand#507](https://github.com/dubzzz/pure-rand/pull/507) shipped at ~+6% / +0.6% / −8% across cases. The author kept it not for the headline number but because it made later optimizations (#516) possible. **A change can earn its merge by clarifying structure even when the direct benchmark is flat.**

**⚠️ Bundle-size wins can carry a runtime cost.**
[pure-rand#970](https://github.com/dubzzz/pure-rand/pull/970) traded ~12.8% bundle for ~2.8% slower `jump()`. That's the right call _if jumps are rare in your workload_ and the wrong call if you're in a jump-heavy hot loop. **Know which budget you're optimizing.**

---

## 8. Checklist when you're handed a hot path

1. **Look for `[value, newState]` returns inside a loop** → mutating primitive + clone-at-boundary (#231/232/239/247-252).
2. **Look for `.slice()` / `.map()` / `[...arr]` on a hot buffer** → mutate in place; move the copy to the public clone() (#948).
3. **Look for `*` between ints that might exceed 2^31** → `Math.imul` (#958).
4. **Look for `+` between disjoint-masked values** → `|` (#951).
5. **Look for `>>> 0` / `| 0` at API boundaries** → can the contract advertise int32 instead? (#510, #512).
6. **Look for `bigint` arithmetic** → demote anything ≤ 2^53 to `number`; replace `* 2^n` with `<< n` (#517, #757).
7. **Look for `Math.floor(a / b)` / `a - (a % b)`** with constant `b` → `~~(a / b)` / `~~(D / k) * k` (#516).
8. **Look for module-top-level expressions** (`1 << 24`, `2 ** -53`) → constant-fold (#959).
9. **Look for repeated `this.foo.bar` / `arr[i]` reads** → hoist to local const (#894).
10. **Look for `while (true) { … if (accept) return … }`** → eager-compute + while-on-rejection (#507).
11. **Look for branches where the cheap case happens 90% of the time** → fast-path it before the general algorithm (#858, #869).
12. **Look for `for` loops with bound that's effectively constant** → unroll (#869).
13. **Look for large constant numeric arrays** → consider packed-string encoding (#970).
14. **Always**: benchmark before; benchmark after; benchmark across the input distribution; don't merge under a 5% threshold without replication.

---

## Appendix: full PR index

| PR | Title | Recipe section |
|---:|---|---|
| [#970](https://github.com/dubzzz/pure-rand/pull/970) | Compress Mersenne jump coefficients | §6 packed strings |
| [#959](https://github.com/dubzzz/pure-rand/pull/959) | No compute at import time (pre-computed) | §4 constant-fold |
| [#958](https://github.com/dubzzz/pure-rand/pull/958) | Faster congruential32 with imul | §2 `Math.imul` |
| [#951](https://github.com/dubzzz/pure-rand/pull/951) | Faster twist in mersenne | §2 `\|` vs `+` |
| [#948](https://github.com/dubzzz/pure-rand/pull/948) | Less memory allocations for mersenne | §1 clone-at-boundary |
| [#894](https://github.com/dubzzz/pure-rand/pull/894) | Drop useless array access in mersenne | §4 hoist locals |
| [#869](https://github.com/dubzzz/pure-rand/pull/869) | Faster uniformInt on large ranges | §5 unroll |
| [#858](https://github.com/dubzzz/pure-rand/pull/858) | Faster small uniformInt | §5 fast-path / §7 closed |
| [#857](https://github.com/dubzzz/pure-rand/pull/857) | Faster large uniformInt via bigint | §3 / §7 closed |
| [#757](https://github.com/dubzzz/pure-rand/pull/757) | Faster uniform distributions on bigint | §3 / §4 hoist |
| [#517](https://github.com/dubzzz/pure-rand/pull/517) | Faster uniform distribution on bigint | §3 demote |
| [#516](https://github.com/dubzzz/pure-rand/pull/516) | Faster uniform distribution on small ranges | §2 `~~` |
| [#512](https://github.com/dubzzz/pure-rand/pull/512) | Faster Congruencial 32bits | §2 int32 contract |
| [#510](https://github.com/dubzzz/pure-rand/pull/510) | Faster Mersenne-Twister | §2 drop `>>> 0` |
| [#507](https://github.com/dubzzz/pure-rand/pull/507) | Drop infinite loop for explicit loop | §5 / §7 |
| [#252](https://github.com/dubzzz/pure-rand/pull/252) | Unsafe `uniformArrayIntDistribution` | §1 unsafe variants |
| [#251](https://github.com/dubzzz/pure-rand/pull/251) | Safe skipN/generateN via unsafe | §1 clone-once-mutate-N |
| [#250](https://github.com/dubzzz/pure-rand/pull/250) | Unsafe `uniformBigIntDistribution` | §1 |
| [#249](https://github.com/dubzzz/pure-rand/pull/249) | Unsafe `uniformIntDistribution` | §1 |
| [#248](https://github.com/dubzzz/pure-rand/pull/248) | Internal callers → unsafe (array-int) | §1 wire internals |
| [#247](https://github.com/dubzzz/pure-rand/pull/247) | Internal callers → unsafe (int) | §1 wire internals |
| [#239](https://github.com/dubzzz/pure-rand/pull/239) | Avoid unneeded instance in xoroshiro::jump | §1 tail-return |
| [#232](https://github.com/dubzzz/pure-rand/pull/232) | Faster xoroshiro jump | §1 jump loops |
| [#231](https://github.com/dubzzz/pure-rand/pull/231) | Faster xorshift jump | §1 jump loops |
