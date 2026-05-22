---
name: js-perf-recipes
description: A recipe book of JavaScript micro-optimization techniques for hot paths. Each recipe describes a generalizable pattern, the JIT/engine reason it works, and a before/after snippet. Apply these when working inside tight loops: PRNGs, hashes, parsers, numeric kernels, anything that runs millions of times per second.
---

> **⚠️ Scope:** Micro-optimization of hot paths in plain JS/TS. Not a substitute for picking a better algorithm.
>
> **🎯 Mindset:**
> 1. Measure first — never guess. Many promising optimizations don't survive a real benchmark.
> 2. Benchmark across the full input distribution — a win at one size can be a loss at another.
> 3. Set a minimum effect threshold (e.g. >5%) before merging — micro-benchmark noise routinely fakes 10–40% wins.
> 4. The cheapest operation is the one you delete.

---

## 1. Mutation over allocation

The single biggest source of wins. JavaScript objects, tuples, and arrays are not free: every allocation is a hidden-class lookup, a GC root, and a potential cache miss. Hot paths that look like `state = state.step()` or `return [value, newState]` allocate _per step_ — and "per step" usually means "per iteration of a 2^N loop somewhere".

**✅ Do** add a private/unsafe mutating primitive to immutable types, and make the immutable API a thin wrapper.

```ts
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

**✅ Do** in N-step loops (e.g. `skipN`, `generateN`, fold, scan), **clone once outside the loop and mutate N times inside**. This reduces allocations from `O(N)` to `O(1)`.

```ts
// Before — O(N) allocations
let cur = state;
for (let i = 0; i !== num; ++i) {
  const next = cur.next();
  out.push(next[0]);
  cur = next[1];                 // new instance per iteration
}

// After — O(1) allocation
const next = state.clone();
for (let i = 0; i !== num; ++i) {
  out.push(next.unsafeStep());   // mutate in place
}
```

**✅ Do** drop tuple returns from internals. If the function mutates state in place, return the raw value, not `[value, state]`.

**✅ Do** audit the tail of a function: if you `return new Klass(a, b, c)` from computed values, mutate a working instance you already have and `return` that instead.

**✅ Do** introduce the unsafe variant _and_ a follow-up that rewires internal callers to use it. The optimization is only half-banked until the internals consume it.

**✅ Do** apply "mutate in place, clone at the boundary" to large array buffers. If a hot helper does `arr.slice()` then mutates, push the `slice()` to the public `clone()` method instead.

```ts
// Before — slice on every call
function transform(prev: number[]): number[] {
  const buf = prev.slice();
  for (let i = 0; i < N; ++i) { /* mutate buf */ }
  return buf;
}

// After — mutate in place; slice only at the immutability boundary
function transform(buf: number[]) {
  for (let i = 0; i < N; ++i) { /* mutate buf */ }
}
clone() { return new Self(this.buf.slice(), this.index); }
```

---

## 2. Stay in int32 land (bitwise > arithmetic)

V8 and JSC represent integers internally as Smi/int32 _as long as the operations preserve that shape_. The moment you do something that could overflow into a double, you pay a representation tag, allocation, and lose the ability to inline.

**✅ Do** use `Math.imul(a, b)` for 32-bit integer multiplication whenever you only need the low 32 bits (LCGs, MurmurHash, xxHash, FNV, bit-mixers).

```ts
// Before — products can exceed 2^53, engine can't safely keep int32
return (seed * MULTIPLIER + INCREMENT) & MASK;

// After — guaranteed low-32-bit multiply; one CPU `imul` instruction
return (Math.imul(seed, MULTIPLIER) + INCREMENT) & MASK;
```

**✅ Do** use bitwise `|` instead of `+` when combining two values masked to disjoint bit ranges.

```ts
// Before — '+' has to consider carry / float fallback
const y = (hi & MASK_UPPER) + (lo & MASK_LOWER);

// After — '|' is a pure int32 op
const y = (hi & MASK_UPPER) | (lo & MASK_LOWER);
```

This also applies to byte packing, building 16-bit words from two bytes, combining nibbles, building RGBA values, etc.

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

**✅ Do** prefer **adding a literal** to **subtracting a named constant** for domain re-centering. The literal folds as an immediate; the named constant goes through a property load.

```ts
// Before
let v = next() - MinValue;   // MinValue = -0x80000000

// After
let v = next() + 0x80000000;
```

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

---

## 3. BigInt is expensive — use it only where Number cannot

BigInt arithmetic is materially slower than Number arithmetic on every engine. Treat BigInt like a foreign type you cross to only when necessary.

**❌ Don't** use `bigint` for loop counters, iteration indexes, small intermediates. If a value is provably bounded by `2^53`, demote it to `number`.

```ts
// Before
let n = BigInt(1);
for (let i = BigInt(0); i !== n; ++i) { /* ... */ }

// After
let n = 1;
for (let i = 0; i !== n; ++i) { /* ... */ }
```

**✅ Do** prefer bit shifts to multiplies on BigInt — the speedup is larger than for Number because the engine can implement `<< 32n` as a word-shift, but `* 0x100000000n` must go through a general multiply.

```ts
// Before
value = NumValues * value + BigInt(out) - MinValue;

// After  (NumValues = 1n << 32n)
value = (value << ThirtyTwo) + BigInt(out + 0x80000000);
```

**✅ Do** stay in the cheap numeric domain as long as possible — do the re-centering / addition on the Number side, _then_ lift to BigInt. One BigInt construction instead of two-plus-a-subtraction.

**⚠️ Caution** delegating to native BigInt is not unconditionally a win: on small-range inputs the BigInt setup cost can dominate hand-rolled multi-word arithmetic. **Benchmark across input sizes.**

---

## 4. Hoist invariants, precompute constants

Anything that doesn't change should run once, not once-per-call.

**✅ Do** hoist module-scope `BigInt` / `RegExp` / `Date` / `Map` literals to the top of the file so they're allocated at import, not per call.

```ts
// Before — re-created on every call
function f() {
  const NumValues = BigInt(0x100000000);
  // ...
}

// After — once per module
const NumValues: bigint = typeof BigInt !== 'undefined' ? BigInt(0x100000000) : undefined!;
function f() { /* uses NumValues */ }
```

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

**✅ Do** hoist repeated property/array reads into a local. The JIT generally can't prove that `this.buf[this.index]` is unchanged between statements (some side effect _could_ have mutated it), so it re-loads. A `const` read is a register/stack access.

```ts
// Before — two indexings, second unnecessary
let y = this.buf[this.index];
y ^= this.buf[this.index] >>> U;

// After
let y = this.buf[this.index];
y ^= y >>> U;
```

---

## 5. Loop and branch shape

The JIT optimizes loops whose shape it can see. Rejection-sampling and rare-fallback loops benefit from being rewritten so the steady state has no branches.

**✅ Do** rewrite `while (true) { v = step(); if (accept(v)) return f(v); }` as **eager-compute-then-loop-on-rejection**. Removes the unconditional branch and the `if/break` from the steady state, and makes loop bounds visible to the JIT.

```ts
// Before
while (true) {
  const out = step();
  const dv = out - MinValue;
  if (dv < MaxAllowed) return dv % rangeSize;
}

// After
let dv = step() - MinValue;
while (dv >= MaxAllowed) {
  dv = step() - MinValue;
}
return dv % rangeSize;
```

**✅ Do** order branches by **frequency × cost**: cheapest probable case first, expensive fallback last. Defer divisions/modulos until you've proven they're necessary.

```ts
// Before — always computes MaxAllowed (a division) and always runs `% rangeSize`
const MaxAllowed = ~~(0x100000000 / rangeSize) * rangeSize;
let v = next() + 0x80000000;
while (v >= MaxAllowed) v = next() + 0x80000000;
return v % rangeSize;

// After — two fast paths
let v = next() + 0x80000000;
if (v < rangeSize) return v;                            // no modulo at all
if (v + rangeSize < 0x100000000) return v % rangeSize;  // modulo, no rejection setup
const MaxAllowed = 0x100000000 - (0x100000000 % rangeSize);
while (v >= MaxAllowed) v = next() + 0x80000000;
return v % rangeSize;
```

**✅ Do** unroll a loop manually when the bound is in practice always the same small constant (2, 3, 4). Removes counter, bounds check, and per-iteration branches; lets the JIT keep values in registers.

```ts
// Before — generic, variable-length
for (let i = 0; i !== rangeLength; ++i) {
  const maxI = i === 0 ? rangeSize[0] + 1 : 0x100000000;
  out[i] = step(maxI);
}

// After — unrolled to the always-2 case
const max0 = rangeSize[0] + 1;
out[0] = step(max0);
out[1] = step(0x100000000);
```

**✅ Do** extract the inner step of a rejection loop into a named helper so the initial call and the retry share one code path (better for the JIT, clearer for readers).

---

## 6. Compact constant data with packed strings

Large constant lookup tables compiled into JS source are huge: each number in `[1927166307, 3044056772, /* ... */]` takes ~11 bytes of source and a numeric slot.

**✅ Do** encode bit/byte data as ASCII strings (each char carries 6–7 bits in a safe printable range, no backslash escapes). Decode with `charCodeAt` — O(1), cheap enough to absorb in most loops, and the parser/minifier compresses strings far better than number arrays.

```ts
// Before — many uint32s, large bundle, slow parse
const COEFS = [1927166307, 3044056772, /* ...hundreds more */];
if (COEFS[i >>> 5] & (1 << (i & 0x1f))) { /* ... */ }

// After — base-64-ish packed string, significantly smaller
const COEFS = 'SUSgbA\\W`E[]KN2RUSo8XVU?HKBFRl11E\\KoWOg5B…';
if ((COEFS.charCodeAt((i / 6) | 0) - 48) & (1 << (i % 6))) { /* ... */ }
```

Trade-off: bundle size shrinks, but decode adds a small per-access cost. Use this recipe when **bundle size matters and the table is touched rarely** (init, jumps, lookup-once-per-N-calls).

**✅ Do** lift the per-word decode out of the inner loop when the decode is hot — decode once per 6 bits, not once per bit.

---

## 7. Negative results & cautionary tales

The recipe here is _when not to optimize_ — and how to recognize a benchmark you shouldn't trust.

**⚠️ "Looked faster, didn't survive replication."**
A ~1.4× single-run delta is well within micro-benchmark noise. **Repeat your benchmark across machines / time-of-day / runtime versions before merging.**

**⚠️ "Win at one input size, regression at others."**
Delegating to a native primitive (e.g. BigInt) can deliver multi-× speedups at large inputs but regress small ones. **Benchmark a representative spread of inputs — the cross-over point matters.**

**⚠️ "Barely invisible win, but enabling refactor."**
A change can earn its merge by clarifying structure even when the direct benchmark is flat — it sets up later optimizations.

**⚠️ Bundle-size wins can carry a runtime cost.**
Trading ~10% bundle for ~3% slower jumps is the right call _if jumps are rare in your workload_ and the wrong call if you're in a jump-heavy hot loop. **Know which budget you're optimizing.**

---

## 8. Checklist when you're handed a hot path

1. **Look for `[value, newState]` returns inside a loop** → mutating primitive + clone-at-boundary.
2. **Look for `.slice()` / `.map()` / `[...arr]` on a hot buffer** → mutate in place; move the copy to the public `clone()`.
3. **Look for `*` between ints that might exceed 2^31** → `Math.imul`.
4. **Look for `+` between disjoint-masked values** → `|`.
5. **Look for `>>> 0` / `| 0` at API boundaries** → can the contract advertise int32 instead?
6. **Look for `bigint` arithmetic** → demote anything ≤ 2^53 to `number`; replace `* 2^n` with `<< n`.
7. **Look for `Math.floor(a / b)` / `a - (a % b)`** with constant `b` → `~~(a / b)` / `~~(D / k) * k`.
8. **Look for module-top-level expressions** (`1 << 24`, `2 ** -53`) → constant-fold.
9. **Look for repeated `this.foo.bar` / `arr[i]` reads** → hoist to local const.
10. **Look for `while (true) { … if (accept) return … }`** → eager-compute + while-on-rejection.
11. **Look for branches where the cheap case happens 90% of the time** → fast-path it before the general algorithm.
12. **Look for `for` loops with bound that's effectively constant** → unroll.
13. **Look for large constant numeric arrays** → consider packed-string encoding.
14. **Always**: benchmark before; benchmark after; benchmark across the input distribution; don't merge under a 5% threshold without replication.
