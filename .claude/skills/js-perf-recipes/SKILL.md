---
name: js-perf-recipes
description: A dense catalog of JavaScript and software-engineering performance recipes. Use when squeezing perf out of a hot loop, a number-crunching routine, an RNG / hashing / parser / serializer, diagnosing a slow function, or designing a hot path. Patterns are grouped by category with concrete before/after sketches and the engine-level reason each works. Most are micro-optimizations: apply only where a profiler points, and benchmark before/after on the target engine.
---

# JS performance recipes

These recipes assume V8-class engines (Node, Chrome, Edge, Deno; JSC has similar behaviors). Most are micro-optimizations: only apply them where a profiler points, and always benchmark before/after on the target engine.

How to use this file:

1. **Find the right category** in the table of contents.
2. **Skim the recipe titles** — each is a one-liner pattern.
3. **Read the bullet** — it states the root cause and the fix.
4. **Verify with a profile** before and after — guesses are wrong more often than not.

Source tags throughout:
- `marvin-N` — Marvin Hagemeister, "Speeding up the JS ecosystem" part N
- `v8` / `node` / `web` / `bundler` / `general` — well-known platform/community recipes

## Table of contents

1. [Meta-rules](#1-meta-rules)
2. [V8 / JS engine internals](#2-v8--js-engine-internals)
3. [Allocation & GC pressure](#3-allocation--gc-pressure)
4. [Hot-path patterns](#4-hot-path-patterns)
5. [Numeric & BigInt math](#5-numeric--bigint-math)
6. [Data structures & algorithms](#6-data-structures--algorithms)
7. [Strings & regex](#7-strings--regex)
8. [Async / event loop](#8-async--event-loop)
9. [Modules, imports, bundling](#9-modules-imports-bundling)
10. [Node.js specific](#10-nodejs-specific)
11. [Browser / DOM](#11-browser--dom)
12. [Profiling & measurement](#12-profiling--measurement)
13. [Anti-pattern → fix cheatsheet](#13-anti-pattern--fix-cheatsheet)
14. [Profiling-a-hot-path checklist](#14-profiling-a-hot-path-checklist)

---

## 1. Meta-rules

- **Profile first.** Use `node --cpu-prof`, Chrome DevTools, Clinic, or 0x; let flat-time and adjacent GC blocks tell you where to look. Don't optimize blind. `marvin-1..13`
- **Caches with low hit-rate are a weak fix.** semver's LRU saved 133 ms over 26k calls (only 523 hits) — the parse was the real problem. Fix the algorithm before adding a cache. `marvin-12`
- **Validation is parsing.** If you validate then parse, you're doing the work twice. Let the parser fail naturally. `marvin-12`
- **Stay in one type universe.** Round-tripping `number → string → number` or `object → string → regex.test` is almost always slower than working with the data structure directly. `marvin-1`, `marvin-12`
- **Push work to setup time / cache time / build time.** Per-call work in a hot loop scales by N; per-setup work runs once. `general`
- **One pass over a long buffer beats N passes over short slices.** Regex setup/teardown dominates for short inputs; OS syscalls dominate for tiny files. `marvin-1`, `marvin-13`
- **Identify the contract, then specialize.** A generic helper that handles 5 cases is megamorphic; 5 specialized functions are each monomorphic. `general`

---

## 2. V8 / JS engine internals

### Hidden classes & inline caches

- **Initialize all fields in the constructor, in a stable order.** Adding properties later (or in different orders) creates divergent maps; reads at known offsets become hash lookups. `v8`
- **Never `delete` a property.** It transitions the object to dictionary mode permanently. Set to `undefined`/`null` instead, or recreate the object. `v8`
- **Keep call sites monomorphic (≤1 shape).** Monomorphic ICs compile to `mov`; >4 shapes go megamorphic and abandon optimization. `v8`
- **Polymorphism budget = 4 shapes.** Past that, V8 falls back to a dispatch table. Split a hot generic into specialized copies if it sees more. `v8`
- **Never declare classes inside functions.** Each call creates a fresh prototype, so consumers see new shapes every call → megamorphic. Hoist `class` to module scope. `v8`
  ```js
  // bad — anonymous class per call
  function makeHandler(opts) {
    return new (class extends Base { /* ... */ })();
  }
  // good — one class, many instances
  class Handler extends Base { /* ... */ }
  function makeHandler(opts) { return new Handler(opts); }
  ```
- **Prefer fixed-shape objects over variable-length ones when the length is statically known.** Replace `{ data: number[] }` with `{ data: [number, number] }`. V8 keeps a stable hidden class, property access is monomorphic, and inner loops can be unrolled. `v8`
  ```js
  // bad — generic, length-driven loop
  for (let i = 0; i !== length; ++i) {
    const size = i === 0 ? head + 1 : 0x100000000;
    out[i] = inner(rng, size);
  }
  // good — fixed-shape, no loop
  out[0] = inner(rng, head + 1);
  out[1] = inner(rng, 0x100000000);
  ```
- **Confirm shape identity with `%HaveSameMap(a, b)`** (Node with `--allow-natives-syntax`). `v8`

### Element kinds & numbers

- **Stay in `PACKED_SMI_ELEMENTS` as long as possible.** Element-kinds transition unidirectionally (Smi → Double → Object, Packed → Holey). One stray write contaminates the whole array. `v8`
- **Avoid creating holes.** `arr[1000] = x` on an empty array, or `new Array(n)` without fill, makes the array holey forever. Use `Array.from({length:n}, () => 0)` or `.fill(0)`. `v8`
- **Prefer SMIs over HeapNumbers.** Smis (31-bit on 32-bit, 32-bit on 64-bit) are tagged inline; anything else boxes. Don't mix floats into integer accumulators. `v8`
- **Use TypedArrays for numeric hot loops.** Float64Array/Int32Array store unboxed, contiguous values; no per-element pointer chase. `v8`

### Int32 fast path

V8 keeps small integers as tagged `Smi`. Bitwise ops always produce int32; arithmetic ops can spill to doubles. When you know a value fits in int32, structure the code so the engine can see it.

- **Keep integer arithmetic in int32 range.** Bit ops (`>>`, `<<`, `|0`, `~~`) require int32; if your math stays in range, V8 emits machine ints instead of boxing. `v8`
  ```js
  // bad — Math.floor + division allocates HeapNumbers
  const idx = Math.floor(n / 32);
  // good — bit shift, int32-preserving
  const idx = n >> 5;
  ```
- **Use `Math.imul` for 32-bit multiply.** `a * b` for ints that may overflow forces double-precision multiply + truncate. `Math.imul` is the explicit 32-bit signed multiply intrinsic and maps to a single CPU `imul`. `v8`
  ```js
  // bad
  return (a * MULTIPLIER + INCREMENT) & MASK;
  // good
  return (Math.imul(a, MULTIPLIER) + INCREMENT) & MASK;
  ```
- **Use `|` instead of `+` for disjoint bit fields.** When two operands share no bits, `|` is equivalent to `+` but stays on the int32 path; `+` can force overflow-handling code. `v8`
  ```js
  // bad
  const y = (a & UPPER_MASK) + (b & LOWER_MASK);
  // good
  const y = (a & UPPER_MASK) | (b & LOWER_MASK);
  ```
- **Use `~~x` for int32 truncation.** Equivalent to `(x | 0)` but works on doubles. Cheaper than `Math.floor` or `% then -` chains for non-negative values. `v8`
  ```js
  // bad
  const k = total - (total % step);
  // good
  const k = ~~(total / step) * step;
  ```
- **Prefer `+ POSITIVE` over `- NEGATIVE`.** Inlining the positive constant avoids a double-subtraction shape and keeps the result a Smi. `v8`
  ```js
  // bad
  const MIN = -0x80000000;
  let v = raw - MIN;
  // good
  let v = raw + 0x80000000;
  ```
- **Align API ranges with the engine's natural representation.** Bitwise ops produce *signed* int32. If your function returns `uint32`, every call pays a `>>> 0` conversion. Re-spec the API to return `[-2^31, 2^31-1]` and the conversion disappears. `v8`
  ```js
  // bad — coerces to uint32 on every call
  static readonly min = 0;
  static readonly max = 0xffffffff;
  return y >>> 0;
  // good — returns native int32 directly
  static readonly min = -0x80000000;
  static readonly max =  0x7fffffff;
  return y;
  ```
- **Precompute reciprocals; prefer `*` over `/` and `~~` over `Math.floor`** for non-negative integers. `general`
  ```js
  // ~8× faster than Math.floor(Math.log(x+1) / Math.log(10))
  const LOG10_INV = 1 / Math.log(10);
  const digits = 2 + ~~(Math.log(x + 1) * LOG10_INV);
  ```

### Optimization killers

- **Don't leak `arguments`.** Returning, assigning, or passing it disables several optimizations. Use rest params `(...args)` if you need an array. `v8 / bluebird`
- **Don't reassign params while reading `arguments`** in sloppy mode. Strict mode decouples them; still avoid. `v8 / bluebird`
- **Avoid `with`, direct `eval`, `debugger` in optimizable functions.** Any of these makes the whole function unoptimizable, even if unreachable. Move into a tiny helper. `v8 / bluebird`
- **Avoid `__proto__`, getters, setters in object literals on hot constructors.** Triggers a slow literal-creation path. `v8 / bluebird`
- **`for-in` is fast only with local var + no enumerable prototype + no enumerable array indices.** Prefer `Object.keys()` + classic `for` for hot iteration. `v8 / bluebird`
- **Strict equality (`===`) beats loose (`==`)** on the hot path — `==` triggers coercion machinery and makes the call polymorphic. `general`
- **Explicit `!== undefined` beats truthy checks** for nullable values. ToBoolean coercion is slower and less monomorphic-friendly. `general`
- **Explicit `=== true` beats truthy for booleans** in option objects (avoids ToBoolean and keeps shape monomorphic). `general`
- **Avoid `yield*` on the hot path** — V8 deopts; extract hot generator bodies into named functions so V8 can optimize them independently. `v8`

### Built-ins

- **Built-ins (via CodeStubAssembler) beat hand-rolled equivalents.** `Promise`/`Map`/`Set`/`Array` methods get inlined into Ignition handlers. `v8`
- **Map/Set use a hash-code-in-spare-bits trick** — V8 stores hash codes in unused length bits, avoiding hidden-class transitions and IC churn. Native `Set` beats user-space hashmaps by ~5×. `v8`

---

## 3. Allocation & GC pressure

The single biggest source of perf loss in idiomatic JS is allocations inside loops — they thrash GC and break inline caches.

- **Closures inside hot functions allocate per call.** Hoist callbacks to module scope and pass state as args. `marvin-1`
  ```js
  // bad — fresh closure per call
  function process(items, x) {
    items.forEach(item => combine(x, item));
  }
  // good — top-level fn, explicit args
  function step(x, item) { return combine(x, item); }
  function process(items, x) { items.forEach(item => step(x, item)); }
  ```
- **Collapse `.map().filter().map()` chains.** Each step allocates an intermediate N-element array. Use a single `for` or a lazy iterator. `general`
- **Reuse output arrays in-place.** `out[i] = …` against a preallocated buffer beats returning a fresh array each iteration. `v8`
- **Pool small objects on hot paths.** Each `{}` allocates + dirties the write barrier. Reuse a freelist. `v8`
- **Avoid intermediate array allocations from `.fill().join()`, `[...].map.reduce`, `arr.slice().reverse()`.** Fuse into one loop. `general`
  ```js
  // bad
  return arr.slice().reverse();
  return Array(n).join(' ');
  return arr.map(unmap).reduce((a, v, i) => a + v * 32 ** (n - i - 1), 0);
  // good
  for (let i = arr.length - 1; i >= 0; --i) /* ... */;
  return ' '.repeat(n - 1);
  let acc = 0, pow = 1; for (let i = arr.length - 1; i >= 0; --i) { acc += unmap(arr[i]) * pow; pow *= 32; }
  ```
- **Split an immutable API from a mutable core (`unsafeFoo`).** Public API stays immutable for the contract; a private `unsafeFoo()` mutates `this` and returns just the value. The immutable form becomes `clone-then-unsafe`. Hot internal loops use the unsafe form. `general`
  ```js
  // bad — every step allocates a new instance + a 2-tuple
  next(): [number, Self] {
    return [(this.s0 + this.s1) | 0,
            new Self(this.s2, this.s3, b1, b0)];
  }
  // good
  private unsafeNext(): number {
    // mutates this.sX in place
    return out;
  }
  next(): [number, Self] {
    const copy = new Self(this.s0, this.s1, this.s2, this.s3);
    return [copy.unsafeNext(), copy];
  }
  ```
- **Expose `unsafe` variants as public API.** For callers in a hot loop, forcing a defensive copy per call is the dominant cost. Offer an opt-in API that skips the copy. `general`
  ```js
  // safe API becomes a thin shim
  function compute(input) {
    const copy = input.clone();
    return [unsafeCompute(copy), copy];
  }
  // hot callers use unsafeCompute directly
  ```
- **Mutate buffers in place; copy only at the boundary.** Replace bulk-rebuild steps (`prev.slice()` + populate) with in-place updates that advance one slot at a time. Reserve copies for `clone()`-style boundaries where they're semantically required. `general`
  ```js
  // bad
  if (++this.index >= N) {
    this.state = rebuild(this.state); // alloc N entries
    this.index = 0;
  }
  function rebuild(prev) {
    const out = prev.slice(); // alloc
    for (let i = 0; i !== N; ++i) { /* ... */ }
    return out;
  }
  // good
  this.index = stepInPlace(this.state, this.index); // no alloc
  function stepInPlace(buf, idx) {
    if (idx < THRESHOLD) { /* update buf[idx] */ return idx + 1; }
    /* wrap */                                       return 0;
  }
  ```
- **Reuse the final mutable runner as the result.** When a loop ends with a runner whose fields you control and no one else holds a reference to, overwrite its fields with the answer rather than allocating a fresh instance. `general`
  ```js
  // bad
  return new Foo(a, b, c, d);
  // good
  runner.x = a; runner.y = b;
  runner.z = c; runner.w = d;
  return runner;
  ```
- **Clone once at the boundary, not per iteration.** Push expensive copies (`.clone()`, `structuredClone`, `{...obj}`) up to the outermost API; let internal helpers mutate freely. Also: return scalars, not tuples, from hot helpers. `general`
- **Reuse a local instead of re-reading an array slot.** The JIT may not be able to prove an array slot is unchanged between reads. If you already have the value in a local, use the local. `v8`
  ```js
  // bad
  let y = arr[i];
  y ^= arr[i] >>> U;   // redundant load
  // good
  let y = arr[i];
  y ^= y >>> U;
  ```
- **Defer expensive serialization (e.g. `Error.stack`) until you actually need it.** Reading `.stack` materializes a costly source-mapped string in V8 — keep raw `error: unknown` and serialize at format time. `general`
- **Drop defensive copies when invariants hold.** A `getData()` returning `slice(this.data)` for a consume-once API → just return `this.data`. `general`
- **Skip closure/getter wiring in the common case.** `Object.defineProperty(.., {get})` for every value when 99% don't need it → branch and use direct field write. `general`
- **Prefer in-place mutation over functional/immutable APIs on inner loops.** A `mutate()` method that updates state in place beats `withChange()` that returns a new instance by one allocation per call. Clone once at the API boundary if callers expect immutability. `general`
- **TypedArrays/ArrayBuffers for fixed-size numeric scratch.** One backing-store allocation, no boxing. `v8`
- **Transferable ArrayBuffers across threads** — `postMessage(buf, [buf])` is zero-copy; the original detaches. `node`
- **SharedArrayBuffer + Atomics** for true cross-thread state (no clone, no transfer). `node`

---

## 4. Hot-path patterns

### Speculative sync (avoid unnecessary `await`)

- Awaiting an already-resolved promise still costs ≥1 microtask. Branch on the runtime type and only `await` when the value is actually a thenable. `general`
  ```js
  // bad — extra microtask on the sync path
  async function run(v) {
    const out = await maybeAsync(v);
    return finalize(out);
  }
  // good — return sync values directly, only await thenables
  function run(v) {
    const out = maybeAsync(v);
    if (typeof out !== 'object' || out === null) return finalize(out);
    return out.then(finalize);
  }
  ```
- **Don't wrap an inner promise in another `async` function** — return it directly. `general`
- **Replace `while+inner-await` loops with recursive `.then()` chains** to avoid parking on extra ticks. `general`

### Cheap branch to skip expensive work

A comparison is much cheaper than `%`, a `while`-loop setup, a `BigInt` op, or a function call. Pay one extra branch up front to skip the heavy path in the common case.

- **Fast-path before rejection sampling / modulo.** `general`
  ```js
  // bad — always pays %, always pays loop setup
  const Limit = ~~(0x100000000 / range) * range;
  let v = sample();
  while (v >= Limit) v = sample();
  return v % range;
  // good — two cheap branches skip both
  let v = sample();
  if (v < range) return v;                       // no %
  if (v + range < 0x100000000) return v % range; // unbiased on first try
  const Limit = 0x100000000 - (0x100000000 % range);
  while (v >= Limit) v = sample();
  return v % range;
  ```
- **Prefer explicit-condition loops over `while (true) { ... if (cond) return }`.** A single exit and a top-of-loop condition are easier for the JIT to inline / unroll than an infinite loop with an internal `return`. `v8`
  ```js
  // bad
  while (true) {
    let v = compute(...);
    if (v < Accepted) return finish(v);
  }
  // good
  let v = compute(...);
  while (v >= Accepted) v = compute(...);
  return finish(v);
  ```

### Drop runtime feature-detection guards at module init

- Once min-runtime is bumped, `typeof X !== 'undefined'` and `BigInt`-presence checks are pure overhead. Delete them. `general`
  ```js
  // bad — runs on every import
  const SArray = typeof Array !== 'undefined' ? Array : undefined!;
  // good
  const SArray = Array;
  ```

### Fast-path + fallback identity check (poisoning-resistance without per-call overhead)

- Capture `untouched = X.prototype.method` once; at the call site, try the direct call and fall back to a safe-apply only if the shape was tampered. `general`
  ```js
  const untouchedPush = Array.prototype.push;
  function safePush(arr, v) {
    if (extractPush(arr) === untouchedPush) return arr.push(v); // fast path
    return Reflect.apply(untouchedPush, arr, [v]);              // fallback
  }
  ```
- **Don't extract this into a generic helper.** The fast path is fragile under monomorphism; copy-paste per method instead. `general`

### Pre-normalize / sanitize at construction time

- Hoist `!= undefined` / `!!flag` and type discovery out of hot loops into the constructor. `general`
- Pick the right backing implementation once at construction based on user options (e.g. strict-equality-backed set vs custom-comparator set). `general`

### Inline option-reading helpers

- A generic `readOrDefault(obj, key, default)` taking a string key is megamorphic (different `key` per call). Inline each access into direct ternaries. `general`
  ```js
  // bad — megamorphic property access
  const timeout = readOrDefault(p, 'timeout', 1000);
  const verbose = readBoolean(p, 'verbose');
  // good — inlined, monomorphic
  const timeout = p.timeout !== undefined ? p.timeout : 1000;
  const verbose = p.verbose === true;
  ```

### Resumable / contextual operations

- For multi-step search/iteration, pass an opaque `context` through so the next call resumes (cursor, last-seen value, startIndex) instead of restarting. `general`
- Return `[value, newContext]` tuples; caller stores it and threads back next time.

### Bypass adapter / converter layers

- When both sides speak the same protocol, detect and call directly instead of going through the wrapper. `general`
- Audit type-coercion boundaries — each adapter layer adds an iterator-protocol layer that fragments inline caches. `general`

---

## 5. Numeric & BigInt math

`BigInt` ops are 1–2 orders of magnitude slower than `number`. Push work into `number` space as long as it fits; promote at the boundary.

- **Do offsets in `number` space, promote at the end.** `general`
  ```js
  // bad — one BigInt subtraction per draw
  v = N * v + (BigInt(raw) - MIN_BIG);
  // good — offset in number, single BigInt() per draw, no extra sub
  v = (v << SHIFT32) + BigInt(raw + 0x80000000);
  ```
- **Use `<<` instead of `*` for BigInt powers of two.** `general`
  ```js
  // bad
  v = N * v + step();
  // good
  v = (v << SHIFT32) + step();
  ```
- **Use `number` for loop counters even in BigInt code.** `general`
  ```js
  // bad — bigint ++ / !== are heap-managed
  for (let i = SBigInt(0); i !== K; ++i) { ... }
  // good — Smi ops in registers
  for (let i = 0;          i !== K; ++i) { ... }
  ```
- **Unroll the first iteration to skip `x * 0n`.** `general`
  ```js
  // bad — first iteration is value=0, N*0 wasted
  let v = SBigInt(0);
  for (let i = 0; i !== K; ++i) {
    v = N * v + step();
  }
  // good
  let v = step();                  // unrolled
  for (let i = 1; i < K; ++i) {
    v = (v << SHIFT32) + step();
  }
  ```
- **Cache `BigInt(...)` constants at module scope.** `BigInt` construction allocates. Build common constants once. `general`
  ```js
  // bad — re-builds each call
  function step() {
    const N = BigInt(0x100000000);
    // ...
  }
  // good — module-scope
  const N       = BigInt(0x100000000);
  const ONE     = BigInt(1);
  const SHIFT32 = BigInt(32);
  ```
- **Delegate cold path to BigInt.** When a hand-rolled `number`-array implementation gets gnarly for a rarely-hit branch, modern BigInt is often fast enough and a lot less code. `general`
  ```js
  export function f(from, to) {
    const range = to - from;
    if (range <= 0xffffffff) {
      return fastNumberPath(range) + from;                        // hot
    }
    return SNumber(slowBigIntPath(SBigInt(from), SBigInt(to))); // cold
  }
  ```

---

## 6. Data structures & algorithms

- **Swap `arr.includes(x)` for a `Set`** when the haystack is reused. O(1) vs O(n); crossover ~n=10. `general`
- **Use `Map` over plain object for dynamic keys.** Stable shape, no prototype lookup, no string-coercion, and hash-code-in-spare-bits optimization. Use a plain object only when keys are compile-time-known and few. `v8`
- **Don't mix integer and string keys** on the same object — they live in different stores (elements vs properties); mixing splits storage and slows iteration. `v8`
- **Linear scan → precomputed lookup table.** O(n) `while/for` over cumulative sums → build the table once at setup time, binary search per query. `general`
- **Memoize pure-but-expensive builders by canonical key.** Module-level `Map<string, T>` keyed on a string form of the inputs. `general`, `marvin-5`
- **Two-phase compute + filter.** When an expensive computation has cheap downstream filtering, do the expensive part once (cache it) and re-run only the cheap filter per call. `general`
- **Replace `findIndex` with binary search** on sorted stores. `marvin-3`
- **Push eligibility checks into traversal (`continue` early), not post-filtering.** `general`

---

## 7. Strings & regex

- **Hoist RegExp literals out of hot loops.** A 42 kB regex was being recompiled 7138× per call to `toShort`. Cache by key. `marvin-5`
  ```js
  // bad — recompiles every call
  function match(s, find) { return s.replace(new RegExp(escapeRegExp(find), 'g'), ''); }
  // good — compile once, key the cache
  const cache = new Map();
  function reFor(find) {
    let r = cache.get(find);
    if (!r) { r = new RegExp(escapeRegExp(find), 'g'); cache.set(find, r); }
    return r;
  }
  ```
- **One regex over the full source beats N regexes over slices** — engine startup per call dominates short inputs. Pre-scan source once for a marker before running per-node checks. `marvin-1`
  ```js
  // bad
  for (const rule of rules) if (/postcss-custom-properties: off/.test(rule.toString())) ...
  // good
  if (!source.includes('postcss-custom-properties')) return;
  ```
- **Sticky `/y` instead of `slice` + global** for tokenizers — matches from `lastIndex`, no string allocation per token. `general`
- **`charCodeAt(i)` beats `s[i]` for char comparison.** Returns a Smi; `s[i]` allocates a 1-char string. `v8`
- **`indexOf` beats regex for fixed substrings** — JIT-compiled to SIMD memchr-style scans. `v8`
- **`+` concat beats `Array.join` for small fixed N** — V8 builds ConsString in O(1), flattens lazily. For 1000+ pieces, `join` wins (avoids quadratic flattening). `v8`
- **Don't share `lastIndex` across global regex calls** — both a correctness and perf trap (re-entrant matchers serialize). Reset or use non-global. `general`
- **Avoid catastrophic backtracking.** Nested quantifiers like `(a+)+$` are exponential. Use possessive constructs or anchor with `/y`. `general`
- **Prefer Unicode property escapes** `\p{Emoji_Presentation}/gu` over generated mega-alternation regexes. `marvin-5`
- **Avoid `toFixed` in hot paths** — allocates a string, requires re-parsing. Use pure math: `Math.round(n * 10 ** p) / 10 ** p`. `marvin-1`
- **Pack large constant tables as 6-bit-per-char strings.** A `number[]` literal of N entries is N source-level numbers for the parser and stays as a typed object at runtime. A 6-bit-per-char ASCII string literal parses faster, is ~50% the source size, and supports O(1) bit lookups with `charCodeAt`. `general`
  ```js
  // bad — many numbers in source
  const TABLE = [1927166307, 3044056772, /* ... */];
  if (TABLE[i >>> 5] & (1 << (i & 0x1f))) { ... }
  // good — packed 6 bits per char, offset 48 to stay in printable ASCII
  const TABLE = 'SUSgbA\\W`E[]KN2...';
  if ((TABLE.charCodeAt((i / 6) | 0) - 48) & (1 << (i % 6))) { ... }
  ```
- **Cache built-string scratch** — when a factory recomputes the same value on each call, memoize at module scope. `general`

---

## 8. Async / event loop

- **`queueMicrotask(fn)` beats `Promise.resolve().then(fn)`** — skips Promise allocation and the resolved-promise state machine. `node`
- **Hoist `await` out of `for` loops** — serializes when you could parallelize. Collect and `Promise.all(xs.map(f))`. Cap concurrency with `p-limit` for unbounded inputs. `general`
- **Don't `await` what you already have** — `await syncValue` schedules an extra microtask. Just return. `v8`
- **Yield to the main thread every ~50 ms** with `await scheduler.yield()` or `setTimeout(0)` to keep INP < 200 ms. `web`
- **`scheduler.postTask({priority:'background'})`** for non-urgent work — real priorities, unlike `setTimeout(0)`'s flat FIFO. `web`
- **`requestIdleCallback`** for deferrable bookkeeping; respect the deadline inside. `web`
- **`requestAnimationFrame`** for any visual update — aligns with the compositor. `setTimeout(16)` causes jank. `web`
- **Debounce input handlers, throttle scroll/resize.** Wrong choice either delays or floods. `general`
- **Structured clone is the hidden cost of `postMessage`** — depth-proportional. For hot channels use Transferables (ArrayBuffer/MessagePort) or SharedArrayBuffer. `node`
- **`receiveMessageOnPort` for poll-style worker loops** — synchronous, non-blocking. `node`
- **`process.nextTick` runs before microtasks** in Node — useful for "really soon", but abuse will starve Promises. `node`

---

## 9. Modules, imports, bundling

### Module-scope: do work at build time, not import time

Constant expressions evaluated at module load still cost ns each and bloat init. Matters most on cold starts (CLIs, serverless).

- **Inline literals, leave derivation in a comment.** `general`
  ```js
  // bad
  const scale = 1 / (1 << 24);
  const mask  = (1 << 24) - 1;
  const HALF  = 2 ** 31;
  // good
  const scale = 5.960464477539063e-8; // = 1 / (1 << 24)
  const mask  = 16777215;             // = (1 << 24) - 1
  const HALF  = 2147483648;           // = 2 ** 31
  ```
- **Cache globals as module locals.** `const SBigInt = BigInt` saves a realm-global lookup per call and is shadow-resistant. `general`
  ```js
  const SBigInt = BigInt;
  const SNumber = Number;
  // use SBigInt(x), SNumber(x) in hot code
  ```

### Imports, bundles, build

- **Narrow deep imports, skip barrels.** A test importing one function from `pkg` pulls in the whole package via re-export index. Remove barrels; ship granular `exports` subpaths. `marvin-7`
  ```ts
  // bad — pulls all of the package
  import { thing } from 'some-pkg';
  // good — only the file you need
  import { thing } from 'some-pkg/thing';
  ```
- **For library authors: ship granular `exports` and `sideEffects: false`** so consumers can tree-shake. `marvin-7`, `bundler`
- **Annotate factory functions with `/**@__NO_SIDE_EFFECTS__*/`** so bundlers can tree-shake unused exports. (TSC strips comments — do it post-emit.) `bundler`
- **Raise TS `target` to current syntax** (e.g. ES2020+) — downleveled async/await becomes a state-machine generator that V8 optimizes worse than native. `bundler`
- **Lazy-require fat modules** that aren't needed on cold paths in CLIs. `npm run` saved ~20 ms by deferring `require('@npmcli/arborist')` into the few commands that use it. `marvin-4`
- **Replace polyfills for shipped features.** A polyfill should no-op when the runtime has the feature. Don't `require('object.assign')(...)` — call `Object.assign` directly. `marvin-6`
- **Cache resolved module paths.** Bare-specifier resolution walks every ancestor for `node_modules`; memoize by `(fromDir, specifier)`. Stale-cache revalidation via `statSync` is ~0.05% overhead. `marvin-2`
- **`fs.statSync(p, {throwIfNoEntry: false})`** instead of `try/catch` on `ENOENT` — exception construction with stack traces is expensive at scale. `marvin-2`
- **Don't ship minified source in npm packages.** One-letter identifiers fight JIT inlining and make profiling unreadable. `marvin-3`
- **Native-code minifiers (esbuild/swc/oxc) > Terser** — 10–100× wall-clock for <2% compression difference. `bundler`
- **Hash-based persistent caches.** Hash inputs (content + config), skip transform on hit. The dominant win in Vite/Webpack 5/Turbopack. `bundler`
- **Don't validate then parse.** Parsing is validation. A hand-rolled token-loop parser was 33× faster than validate-then-regex-then-parse for semver. `marvin-12`
- **Don't parse what you're going to regenerate.** Tailwind bypassed PostCSS entirely and emitted CSS rules directly from candidates: 1.4 s → 192 ms. `marvin-8`
- **Isolated declarations: require explicit return types on exported APIs** so `.d.ts` emit becomes pure syntax-stripping (and parallelizable). Vue: 1m54s → 1.35 s. `marvin-10`
- **Cross-language plugins: don't serialize ASTs via JSON.** Use a shared buffer + lazy facade so only the nodes the plugin touches are materialized. `marvin-11`
- **Skip intermediate artifacts when you only need the metadata.** `pacote.tarball()` + `tar.list` built a full tarball just to read filenames — `npm-packlist(tree)` returns them directly. `general`
- **Fuse traversal with config discovery.** Walking 50k directories with separate "find configs" pass costs 150k syscalls; check config names against dir entries already in hand during the work pass. `marvin-13`

---

## 10. Node.js specific

- **`sync` fs blocks the libuv pool.** Use `fsPromises` and let libuv parallelize; bump `UV_THREADPOOL_SIZE` for many large ops. `node`
- **Respect stream backpressure.** When `write()` returns `false`, wait for `'drain'`. Ignoring causes unbounded buffering → OOM. `node`
- **Prefer `pipeline()` over `pipe()`** — auto error propagation + cleanup. `node`
- **`cork()` / `nextTick(() => stream.uncork())`** to coalesce many small writes into one syscall. `node`
- **Set `highWaterMark` per-stream.** Object-mode measures objects, not bytes — default 16 may starve or flood. `node`
- **Bulk file ops over recursive walks.** Compute the keep-set up front, then `fs.rm(path, {recursive:true})` for everything else in one syscall instead of per-node stat. `general`
- **Worker pool, not one-shot Workers.** Spinup is multi-ms; amortize. Workers help CPU-bound work; I/O stays on the main loop. `node`
- **Set `resourceLimits` per Worker** — `maxOldGenerationSizeMb`, `maxYoungGenerationSizeMb`, `stackSizeMb` — runaway workers kill the host otherwise. `node`
- **Use `worker.performance.eventLoopUtilization()`** to detect saturation before latency spikes. `node`
- **`Buffer.allocUnsafe(n).fill(0)` beats `Buffer.alloc(n, 0)`** — uses the 4 KiB pool; alloc zero-fills outside it. `node`
- **`Buffer.allocUnsafeSlow` for retained small buffers** — pooled slices pin the whole 8 KiB slab in memory. `node`
- **`Buffer.concat([…], totalLength)`** — pass the total length explicitly when you know it; skips the sum pass. `node`
- **`postMessageToThread` (Node ≥20.19)** — skip parent relay for nested worker chains. `node`
- **`why-is-node-running`** — prints what keeps the loop alive when you expected exit. `node`
- **`llnode`** — walk heap from a crashed core dump; the only way to inspect state after OOM. `node`

---

## 11. Browser / DOM

- **Layout-thrashing reads force sync layout** inside a write loop → N² layouts. Batch all reads, then all writes. The culprits: `offsetTop/Left/Width/Height`, `clientWidth/Height`, `scrollTop/Left/Width/Height`, `getBoundingClientRect`, `getClientRects`, `getComputedStyle` (when reading layout-affected props). `web`
- **Animate only `transform` and `opacity`** — they live on the compositor thread; `top/left/width/height` retrigger layout+paint each frame. `web`
- **`will-change: transform`** to promote to a layer — add just before animation, remove after; abuse blows up GPU memory. `web`
- **Passive event listeners** `{passive: true}` on `scroll/touch/wheel` — eliminates ~100 ms scroll-start latency on touch. `web`
- **`IntersectionObserver`** instead of scroll+`getBoundingClientRect`. `web`
- **`ResizeObserver`** instead of polling `clientWidth`. `web`
- **`OffscreenCanvas` + Worker** for heavy 2D/WebGL. `web`
- **Move JSON/crypto/image decode to a Worker.** Anything >50 ms blocks INP. Clone cost is usually trivial vs the main-thread time saved. `web`
- **Long Animation Frame API (`PerformanceLongAnimationFrameTiming`)** for real-user diagnosis — attributes the script/style/layout that blew the budget. `web`
- **Optimize LCP: lower TTFB, `fetchpriority="high"`, preload, inline above-the-fold CSS.** LCP attribution = TTFB + load delay + load time + render delay. `web`
- **Reserve space (CLS).** `aspect-ratio`/explicit width+height/min-height; inserting above existing content is the #1 CLS source. `web`
- **Static JSX → compile-time templates.** A precompile transform emits static HTML fragments + a `jsxTemplate(parts, ...dyn)` call instead of `h()` vnodes. 7–20× faster, ~50% less GC. `marvin-9`

---

## 12. Profiling & measurement

- **Microbench warmup is mandatory** — without ≥10k iterations you're measuring the interpreter, not TurboFan. `v8`
- **`performance.now()`** for sub-millisecond timing; `console.time` rounds to ~µs and serializes against the console transport. `general`
- **`performance.mark` + `performance.measure`** — surfaced in DevTools and `getEntriesByType('measure')`. One source of truth. `general`
- **`perf_hooks.monitorEventLoopDelay`** — sampled histogram of loop lag, lock-free. `node`
- **`--trace-opt` / `--trace-deopt`** — logs every (de)optimization with file:line. Pinpoints the callsite responsible for a regression. `v8`
- **`--trace-ic`** — dumps IC state transitions (mono→poly→megamorphic). Definitive diagnosis for "fast becomes slow." `v8`
- **`--prof` then `node --prof-process isolate-*.log`** — sorted hot ticks with JS/C++/Shared breakdown. `node`
- **Clinic Doctor** picks Flame/Bubbleprof/HeapProfiler based on bottleneck shape. `node`
- **0x flamegraph: wide stacks = hot; deep narrow stacks = recursion or megamorphism.** `node`
- **DevTools Performance: look at Long Tasks band first.** Anything >50 ms blocks INP; click to attribute Script/Style/Layout/Paint. `web`
- **"Forced reflow" red triangles** in DevTools Performance — chase the call site. `web`
- **2 heap snapshots + compare.** "Objects allocated between snapshots" still alive at snap 2 = leak candidate. `web`
- **`web-vitals` library with `attribution` build** — `onINP(cb, {reportAllChanges: true})` returns the event target + script URL responsible. `web`
- **`--cpu-prof`** writes a `.cpuprofile` loadable in Chrome DevTools — zero-dep alternative. `node`
- **`--heap-prof`** for sampled allocation profiles — identifies *what allocates*, not just what's retained. `node`

---

## 13. Anti-pattern → fix cheatsheet

| Anti-pattern | Fix | Tag |
|---|---|---|
| `try { fs.statSync(p) } catch(ENOENT)` | `fs.statSync(p, {throwIfNoEntry: false})` | `marvin-2` |
| `new RegExp(pat)` in loop body | hoist + cache by key | `marvin-5` |
| `n.toFixed(p)` then re-parse | `Math.round(n * 10**p) / 10**p` | `marvin-1` |
| `str.replace(/^0/, '')` | `str.slice(1)` | `marvin-1` |
| Closures inside hot functions | top-level fn + explicit args | `marvin-1` |
| `rule.toString().match(...)` per node | source-level pre-check first | `marvin-1` |
| Validate then parse | parse only (let parser reject) | `marvin-12` |
| Strings as data (semver versions) | real structs | `marvin-12` |
| `require('object.assign')(...)` | `Object.assign(...)` | `marvin-6` |
| Barrel re-export imports | deep imports + `exports` subpaths | `marvin-7` |
| Re-parsing what you'll regenerate (PostCSS in Tailwind) | bypass + emit directly | `marvin-8` |
| Allocating vnodes for static JSX | compile-time templates | `marvin-9` |
| Inferring `.d.ts` types per build | explicit return types + isolated decls | `marvin-10` |
| JSON across native↔JS | shared buffer + lazy facade | `marvin-11` |
| Separate pre-scan + work pass | single fused traversal | `marvin-13` |
| Top-level `require` of fat modules | lazy require per subcommand | `marvin-4` |
| Caches with low hit-rate | fix the algorithm | `marvin-12` |
| Minified source in npm | ship readable | `marvin-3` |
| Long ancestor walks for module resolution | memoize resolutions | `marvin-2` |
| `await syncValue` | branch on thenable, return otherwise | `general` |
| `output == null` | `output === undefined` | `general` |
| Truthy check on options | `=== true` / `!== undefined` | `general` |
| `typeof X === 'undefined'` runtime guard | delete after min-runtime bump | `general` |
| Anonymous class per call | top-level class | `v8` |
| Generic `readOrDefault(p, key, d)` | inline ternaries | `general` |
| Recompute factory output per call | module-level lazy singleton | `general` |
| `Math.floor(n / 32)` | `n >> 5` | `v8` |
| `Math.floor(Math.log(x) / Math.log(10))` | `~~(Math.log(x) * LOG10_INV)` | `general` |
| `a * b` where ints may overflow | `Math.imul(a, b)` | `v8` |
| `+` on disjoint bit fields | `\|` | `v8` |
| `raw - NEGATIVE_CONST` | `raw + POSITIVE_CONST` | `v8` |
| `>>> 0` on every uint32 return | re-spec API as signed `[-2^31, 2^31-1]` | `v8` |
| `Math.floor` for non-negative truncation | `~~x` | `v8` |
| Variable-length array for known fixed length | `[a, b]` fixed-shape | `v8` |
| `while (true) { ... if (cond) return }` | top-of-loop explicit condition | `v8` |
| Always run `%` + rejection loop | fast-path branch before modulo | `general` |
| `let y = arr[i]; ... arr[i]` re-read | cache in local once | `v8` |
| Tuple `[value, newState]` per step | mutate in place, return scalar | `general` |
| `prev.slice()` + populate per step | in-place index update | `general` |
| `new Foo(...)` at loop end | overwrite a reusable runner | `general` |
| Defensive `.clone()` per call | expose `unsafeFoo` variant | `general` |
| `arr.slice().reverse()` | reverse-index `for` | `general` |
| `Array(n).join(s)` | `s.repeat(n-1)` | `general` |
| `[...].map(f).reduce(...)` | fused single loop | `general` |
| Immutable `.withChange()` returning new instance | in-place `.mutate()` (clone at API edge) | `general` |
| `defineProperty(this, 'value', {get})` always | branch on need-to-clone | `general` |
| `Object.keys(o).forEach` | `for (const k in o)` (when safe) | `general` |
| `arr.includes(x)` for reused haystack | `Set` lookup | `general` |
| Linear scan over cumulative sums | precomputed array + binary search | `general` |
| `yield*` on hot path | explicit `for` + extracted fn | `v8` |
| `Error.stack` read on every failure | defer to format time | `general` |
| Safe-apply through descriptor walk | identity-check + direct call fast path | `general` |
| Defensive `slice()` for consume-once | return internal array | `general` |
| `1 / (1 << 24)` etc. at module load | inline literal + derivation comment | `general` |
| Re-build `BigInt(K)` per call | module-scope const | `general` |
| `BigInt` loop counter | `number` counter, even in BigInt code | `general` |
| `N * v` for BigInt powers of two | `v << SHIFT` | `general` |
| `BigInt(raw) - MIN_BIG` per step | offset in number, single `BigInt(...)` | `general` |
| First-iter `x * 0n` | unroll iteration 0 | `general` |
| Hand-rolled wide-int for cold branch | delegate to BigInt | `general` |
| `number[]` constant table in source | 6-bit packed string + `charCodeAt` | `general` |
| `globalThis.BigInt(x)` per call | `const SBigInt = BigInt` at module top | `general` |
| Animating `top/left` | animate `transform` | `web` |
| `scrollTop` polling | `IntersectionObserver` | `web` |
| `setTimeout(fn, 16)` for animation | `requestAnimationFrame` | `web` |
| Reading layout props inside write loop | batch reads, then writes | `web` |
| `new Array(n)` (holes) | `Array.from({length:n}, () => 0)` | `v8` |
| `delete obj.prop` | `obj.prop = undefined` | `v8` |
| Generic function for many shapes | N specialized monomorphic copies | `v8` |
| `Buffer.alloc(n, 0)` | `Buffer.allocUnsafe(n).fill(0)` | `node` |
| Spawning a Worker per task | Worker pool | `node` |
| `pipe()` on streams | `pipeline()` | `node` |
| `await` in `for` loop | `Promise.all(xs.map(f))` (capped) | `general` |
| `Promise.resolve().then(fn)` | `queueMicrotask(fn)` | `node` |
| `setTimeout(0)` to yield | `scheduler.yield()` / `postTask` | `web` |
| Unbounded `Promise.all` | `p-limit` semaphore | `general` |

---

## 14. Profiling-a-hot-path checklist

Use this in order when a profile points at a single function:

1. **Allocations in the loop?** → mutate in place, hoist `clone()`, return scalars not tuples, reuse the final runner.
2. **`+` / `*` on int-shaped numbers?** → try `|`, `^`, `Math.imul`, `~~`.
3. **`BigInt` in the inner loop?** → stay in `number`, cache constants at module scope, shift instead of multiply, unroll iter 0.
4. **`%` or `while(true)` rejection?** → add fast-path branches; rewrite as explicit-condition loop.
5. **Constants computed at import?** → inline literals, comment the derivation.
6. **Variable-length container with a known fixed length?** → use a fixed-shape object.
7. **Big constant table?** → consider 6-bit packed string.
8. **Globals like `BigInt`, `Number` looked up in hot code?** → alias at module scope.
9. **Defensive `clone()` on every call?** → expose an `unsafe` variant for hot callers.
10. **Megamorphic helper called from many sites?** → split into N specialized monomorphic copies.
11. **`await` of a value that's often sync?** → branch on thenable, return directly.
12. **Layout-thrashing read inside a DOM-write loop?** → batch all reads then all writes.

---

## Sources

- Marvin Hagemeister, "Speeding up the JavaScript ecosystem" parts 1–13: <https://marvinh.dev/blog/>
- V8 internals references: <https://github.com/thlorenz/v8-perf>, V8 blog posts (`v8.dev/blog`).
- Node.js docs: `nodejs.org/api/{stream,buffer,worker_threads,perf_hooks}.html`.
- Bluebird Optimization Killers wiki.
- Paul Irish's "What forces layout / reflow" gist.
- Esbuild architecture docs.
- web.dev / GoogleChrome `web-vitals`.
- Clinic.js, 0x, `--cpu-prof`/`--heap-prof` docs.
