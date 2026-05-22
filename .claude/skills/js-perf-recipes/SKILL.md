---
name: js-perf-recipes
description: A dense catalog of JavaScript and software-engineering performance recipes. Use when asked to speed up JS/TS code, diagnose a slow function, review a perf-flavored PR, or design a hot path. Patterns are grouped by category with concrete before/after sketches and source attribution (fast-check ⚡️ PRs, Marvin Hagemeister's "Speeding up the JS ecosystem" series, V8 internals, Node.js, bundlers, browser/DOM, profiling).
---

# JS performance recipes

How to use this file:

1. **Find the right category** in the table of contents.
2. **Skim the recipe titles** — each is a one-liner pattern.
3. **Read the bullet** — it states the root cause and the fix.
4. **Verify with a profile** before and after — guesses are wrong more often than not.

Source tags throughout:
- `fc#NNNN` — fast-check ⚡️ PR (look up `gh pr view NNNN`)
- `marvin-N` — Marvin Hagemeister, "Speeding up the JS ecosystem" part N
- `v8` / `node` / `web` / `bundler` — well-known platform recipes

## Table of contents

1. [Meta-rules](#1-meta-rules)
2. [V8 / JS engine internals](#2-v8--js-engine-internals)
3. [Allocation & GC pressure](#3-allocation--gc-pressure)
4. [Hot-path patterns](#4-hot-path-patterns)
5. [Data structures & algorithms](#5-data-structures--algorithms)
6. [Strings & regex](#6-strings--regex)
7. [Async / event loop](#7-async--event-loop)
8. [Modules, imports, bundling](#8-modules-imports-bundling)
9. [Node.js specific](#9-nodejs-specific)
10. [Browser / DOM](#10-browser--dom)
11. [Property-based testing & generators](#11-property-based-testing--generators)
12. [Profiling & measurement](#12-profiling--measurement)
13. [Anti-pattern → fix cheatsheet](#13-anti-pattern--fix-cheatsheet)

---

## 1. Meta-rules

- **Profile first.** Use `node --cpu-prof`, Chrome DevTools, Clinic, or 0x; let flat-time and adjacent GC blocks tell you where to look. Don't optimize blind. `marvin-1..13`
- **Caches with low hit-rate are a weak fix.** semver's LRU saved 133 ms over 26k calls (only 523 hits) — the parse was the real problem. Fix the algorithm before adding a cache. `marvin-12`
- **Validation is parsing.** If you validate then parse, you're doing the work twice. Let the parser fail naturally. `marvin-12`
- **Stay in one type universe.** Round-tripping `number → string → number` or `object → string → regex.test` is almost always slower than working with the data structure directly. `marvin-1`, `marvin-12`
- **Push work to setup time / cache time / build time.** Per-call work in a hot loop scales by N; per-setup work runs once. `fc#5402`, `fc#4730`, `fc#5389`
- **One pass over a long buffer beats N passes over short slices.** Regex setup/teardown dominates for short inputs; OS syscalls dominate for tiny files. `marvin-1`, `marvin-13`
- **Identify the contract, then specialize.** A generic helper that handles 5 cases is megamorphic; 5 specialized functions are each monomorphic. `fc#1264`, `fc#1354`, `fc#1996`, `fc#3112`

---

## 2. V8 / JS engine internals

### Hidden classes & inline caches

- **Initialize all fields in the constructor, in a stable order.** Adding properties later (or in different orders) creates divergent maps; reads at known offsets become hash lookups. `v8`
- **Never `delete` a property.** It transitions the object to dictionary mode permanently. Set to `undefined`/`null` instead, or recreate the object. `v8`
- **Keep call sites monomorphic (≤1 shape).** Monomorphic ICs compile to `mov`; >4 shapes go megamorphic and abandon optimization. `v8`
- **Polymorphism budget = 4 shapes.** Past that, V8 falls back to a dispatch table. Split a hot generic into specialized copies if it sees more. `v8`
- **Never declare classes inside functions.** Each call creates a fresh prototype, so consumers see new shapes every call → megamorphic. Hoist `class` to module scope. `v8`, `fc#1264`
  ```js
  // bad — anonymous class per call
  function makeArbitrary(opts) {
    return new (class extends Arbitrary { /* ... */ })();
  }
  // good — one class, many instances
  class MapArbitrary extends Arbitrary { /* ... */ }
  function makeArbitrary(opts) { return new MapArbitrary(opts); }
  ```
- **Confirm shape identity with `%HaveSameMap(a, b)`** (Node with `--allow-natives-syntax`). `v8`

### Element kinds & numbers

- **Stay in `PACKED_SMI_ELEMENTS` as long as possible.** Element-kinds transition unidirectionally (Smi → Double → Object, Packed → Holey). One stray write contaminates the whole array. `v8`
- **Avoid creating holes.** `arr[1000] = x` on an empty array, or `new Array(n)` without fill, makes the array holey forever. Use `Array.from({length:n}, () => 0)` or `.fill(0)`. `v8`
- **Prefer SMIs over HeapNumbers.** Smis (31-bit on 32-bit, 32-bit on 64-bit) are tagged inline; anything else boxes. Don't mix floats into integer accumulators. `v8`
- **Keep integer arithmetic in int32 range.** Bit ops (`>>`, `<<`, `|0`, `~~`) require int32; if your math stays in range, V8 emits machine ints instead of boxing. `fc#4098`, `fc#3551`, `fc#3547`
  ```js
  // bad — Math.floor + division allocates HeapNumbers
  const idx = Math.floor(n / 32);
  // good — bit shift, int32-preserving
  const idx = n >> 5;
  ```
- **Precompute reciprocals; prefer `*` over `/` and `~~` over `Math.floor`** for non-negative integers. `fc#3551`
  ```js
  // 8× faster than Math.floor(Math.log(x+1) / Math.log(10))
  const LOG10_INV = 1 / Math.log(10);
  const digits = 2 + ~~(Math.log(x + 1) * LOG10_INV);
  ```
- **Use TypedArrays for numeric hot loops.** Float64Array/Int32Array store unboxed, contiguous values; no per-element pointer chase. `v8`

### Optimization killers

- **Don't leak `arguments`.** Returning, assigning, or passing it disables several optimizations. Use rest params `(...args)` if you need an array. `v8 / bluebird`
- **Don't reassign params while reading `arguments`** in sloppy mode. Strict mode decouples them; still avoid. `v8 / bluebird`
- **Avoid `with`, direct `eval`, `debugger` in optimizable functions.** Any of these makes the whole function unoptimizable, even if unreachable. Move into a tiny helper. `v8 / bluebird`
- **Avoid `__proto__`, getters, setters in object literals on hot constructors.** Triggers a slow literal-creation path. `v8 / bluebird`
- **`for-in` is fast only with local var + no enumerable prototype + no enumerable array indices.** Prefer `Object.keys()` + classic `for` for hot iteration. `v8 / bluebird`
- **Strict equality (`===`) beats loose (`==`)** on the hot path — `==` triggers coercion machinery and makes the call polymorphic. `fc#5583`, `fc#4471`, `fc#4345`
- **Explicit `!== undefined` beats truthy checks** for nullable values. ToBoolean coercion is slower and less monomorphic-friendly. `fc#5901`, `fc#5677`, `fc#5676`
- **Explicit `=== true` beats truthy for booleans** in option objects (avoids ToBoolean and keeps shape monomorphic). `fc#5677`, `fc#5676`
- **Avoid `yield*` on the hot path** — V8 deopts; extract hot generator bodies into named functions so V8 can optimize them independently. `fc#3564`

### Built-ins

- **Built-ins (via CodeStubAssembler) beat hand-rolled equivalents.** `Promise`/`Map`/`Set`/`Array` methods get inlined into Ignition handlers. `v8`
- **Map/Set use a hash-code-in-spare-bits trick** — V8 stores hash codes in unused length bits, avoiding hidden-class transitions and IC churn. Native `Set` beats user-space hashmaps by ~5×. `v8`, `fc#2600`

---

## 3. Allocation & GC pressure

- **Closures inside hot functions allocate per call.** Hoist callbacks to module scope and pass state as args. `marvin-1`, `fc#1943`
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
- **Avoid intermediate array allocations from `.fill().join()`, `[...].map.reduce`, `arr.slice().reverse()`.** Fuse into one loop. `fc#6448`, `fc#4091`, `fc#4088`, `fc#1265`
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
- **Defer expensive serialization (e.g. `Error.stack`) until you actually need it.** Reading `.stack` materializes a costly source-mapped string in V8 — keep raw `error: unknown` and serialize at format time. `fc#5584`, `fc#4472`
- **Drop defensive copies when invariants hold.** `set.getData()` returning `safeSlice(this.data)` for a consume-once API → just return `this.data`. `fc#3100`
- **Skip closure/getter wiring in the common case.** `Object.defineProperty(.., {get})` for every value when 99% don't need it → branch on `hasCloneMethod` and use direct field write. `fc#1948`, `fc#1946`, `fc#1945`
- **Prefer in-place mutation over functional/immutable APIs on inner loops.** `rng.unsafeJump()` (mutate) beats `rng.jump()` (returns new instance) by one tuple-allocation per draw. Clone once at the API boundary if callers expect immutability. `fc#3563`, `fc#1953`
- **TypedArrays/ArrayBuffers for fixed-size numeric scratch.** One backing-store allocation, no boxing. `v8`
- **Transferable ArrayBuffers across threads** — `postMessage(buf, [buf])` is zero-copy; the original detaches. `node`
- **SharedArrayBuffer + Atomics** for true cross-thread state (no clone, no transfer). `node`

---

## 4. Hot-path patterns

### Speculative sync (avoid unnecessary `await`)

- Awaiting an already-resolved promise still costs ≥1 microtask. Branch on the runtime type and only `await` when the value is actually a thenable. `fc#6475`, `fc#6474`, `fc#5891`
  ```js
  // bad — extra microtask on the sync path
  async function run(v) {
    const out = await predicate(v);
    return outputToPropertyAnswer(out);
  }
  // good — return sync values directly, only await thenables
  function run(v) {
    const out = predicate(v);
    if (typeof out !== 'object' || out === null) return outputToPropertyAnswer(out);
    return out.then(outputToPropertyAnswer);
  }
  ```
- **Don't wrap an inner promise in another `async` function** — return it directly. `fc#5615`, `fc#5614`
- **Replace `while+inner-await` loops with recursive `.then()` chains** to avoid parking on extra ticks. `fc#5891`

### Drop runtime feature-detection guards at module init

- Once min-runtime is bumped, `typeof X !== 'undefined'` and `BigInt`-presence checks are pure overhead. Delete them. `fc#5617`, `fc#5212`, `fc#5612`
  ```js
  // bad — runs on every import
  const SArray = typeof Array !== 'undefined' ? Array : undefined!;
  // good
  const SArray = Array;
  ```

### Fast-path + fallback identity check (poisoning-resistance without per-call overhead)

- Capture `untouched = X.prototype.method` once; at the call site, try the direct call and fall back to `safeApply` only if shape was tampered. `fc#3112`, `fc#3105`
  ```js
  const untouchedPush = Array.prototype.push;
  function safePush(arr, v) {
    if (extractPush(arr) === untouchedPush) return arr.push(v); // fast path
    return safeApply(untouchedPush, arr, [v]);                  // fallback
  }
  ```
- **Don't extract this into a generic helper.** The fast path is fragile under monomorphism; copy-paste per method instead. `fc#3112` (comment in source)

### Pre-normalize / sanitize at construction time

- Hoist `!= undefined` / `!!flag` and type discovery out of hot generate/shrink loops into the constructor. `fc#2975`, `fc#2617`, `fc#2603`
- Pick the right backing implementation once at construction based on user options (`StrictlyEqualSet` vs `CustomEqualSet`). `fc#2600`

### Inline option-reading helpers

- A generic `readOrDefault(obj, key, default)` taking a string key is megamorphic (different `key` per call). Inline each access into direct ternaries. `fc#5677`, `fc#5676`
  ```js
  // bad — megamorphic property access
  const timeout = readOrDefault(p, 'timeout', 1000);
  const verbose = readBoolean(p, 'verbose');
  // good — inlined, monomorphic
  const timeout = p.timeout !== undefined ? p.timeout : 1000;
  const verbose = p.verbose === true;
  ```

### Resumable / contextual operations

- For multi-step search/shrink, pass an opaque `context` through so the next call resumes (cursor, last-passing-value, startIndex) instead of restarting. `fc#1358`, `fc#1372`, `fc#1377`, `fc#1382`, `fc#1383`, `fc#1384`, `fc#2395`
- Return `[value, newContext]` tuples; caller stores it and threads back next time.

### Bypass adapter / converter layers

- When both sides speak the same protocol, detect and call directly instead of going through the wrapper. `fc#1944`
- Audit type-coercion boundaries — each `stream(...)` wrap or adapter layer adds an iterator-protocol layer that fragments inline caches. `fc#3553`, `fc#3552`

---

## 5. Data structures & algorithms

- **Swap `arr.includes(x)` for a `Set`** when the haystack is reused. O(1) vs O(n); crossover ~n=10. `general`, `fc#5372`
- **Use `Map` over plain object for dynamic keys.** Stable shape, no prototype lookup, no string-coercion, and hash-code-in-spare-bits optimization. Use a plain object only when keys are compile-time-known and few. `v8`
- **Don't mix integer and string keys** on the same object — they live in different stores (elements vs properties); mixing splits storage and slows iteration. `v8`
- **Linear scan → precomputed lookup table.** O(n) `while/for` over cumulative sums → build the table once at builder time, binary search per query. `fc#5386`
- **Memoize pure-but-expensive builders by canonical key.** Module-level `Map<string, T>` keyed on a string form of the inputs. ~200 ops/s → ~130k ops/s in `webUrl`. `fc#5402`, `marvin-5`
- **Two-phase compute + filter.** When an expensive computation has cheap downstream filtering, do the expensive part once (cache it) and re-run only the cheap filter per call. `fc#5389`, `fc#5388`, `fc#5387`
- **`letrec` instead of `memo` for self-referential structures** — same expressiveness, less memory + faster construction. `fc#2309`
- **Push eligibility checks into traversal (`continue` early), not post-filtering.** `fc#3317`, `fc#1892`
- **Skip useless coin-flips on the bias path** — when `minLength === maxLength`, length is fixed, so don't roll for it. `fc#2423`
- **Replace `findIndex` with binary search** on sorted stores. `marvin-3`

---

## 6. Strings & regex

- **Hoist RegExp literals out of hot loops.** A 42 kB regex was being recompiled 7138× per `toShort` call. Cache by key. `marvin-5`
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
- **`+` concat beats `Array.join` for small fixed N** — V8 builds ConsString in O(1), flattens lazily. For 1000+ pieces, `join` wins (avoids quadratic flattening). `v8`, `fc#4088`
- **Don't share `lastIndex` across global regex calls** — both a correctness and perf trap (re-entrant matchers serialize). Reset or use non-global. `general`
- **Avoid catastrophic backtracking.** Nested quantifiers like `(a+)+$` are exponential. Use possessive constructs or anchor with `/y`. `general`
- **Prefer Unicode property escapes** `\p{Emoji_Presentation}/gu` over generated mega-alternation regexes. `marvin-5`
- **Avoid `toFixed` in hot paths** — allocates a string, requires re-parsing. Use pure math: `Math.round(n * 10 ** p) / 10 ** p`. `marvin-1`
- **Cache built-string scratch** — when a factory recomputes the same sub-arbitrary on each call, memoize at module scope. `fc#5678` (3.6× speedup on `ipV6`)

---

## 7. Async / event loop

- **`queueMicrotask(fn)` beats `Promise.resolve().then(fn)`** — skips Promise allocation and the resolved-promise state machine. `node`
- **Hoist `await` out of `for` loops** — serializes when you could parallelize. Collect and `Promise.all(xs.map(f))`. Cap concurrency with `p-limit` for unbounded inputs. `general`
- **Don't `await` what you already have** — `await syncValue` schedules an extra microtask. Just return. `v8`, `fc#6475`, `fc#6474`
- **Yield to the main thread every ~50 ms** with `await scheduler.yield()` or `setTimeout(0)` to keep INP < 200 ms. `web`
- **`scheduler.postTask({priority:'background'})`** for non-urgent work — real priorities, unlike `setTimeout(0)`'s flat FIFO. `web`
- **`requestIdleCallback`** for deferrable bookkeeping; respect the deadline inside. `web`
- **`requestAnimationFrame`** for any visual update — aligns with the compositor. `setTimeout(16)` causes jank. `web`
- **Debounce input handlers, throttle scroll/resize.** Wrong choice either delays or floods. `general`
- **Structured clone is the hidden cost of `postMessage`** — depth-proportional. For hot channels use Transferables (ArrayBuffer/MessagePort) or SharedArrayBuffer. `node`
- **`receiveMessageOnPort` for poll-style worker loops** — synchronous, non-blocking. `node`
- **`process.nextTick` runs before microtasks** in Node — useful for "really soon", but abuse will starve Promises. `node`

---

## 8. Modules, imports, bundling

- **Narrow deep imports, skip barrels.** A test importing one function from `pkg` pulls in the whole package via re-export index. Remove barrels; ship granular `exports` subpaths. `marvin-7`, `fc#6661`, `fc#5718`
  ```ts
  // bad — pulls all of pure-rand
  import { xorshift128plus } from 'pure-rand';
  // good — only the file you need
  import { xorshift128plus } from 'pure-rand/generator/XorShift';
  ```
- **For library authors: ship granular `exports` and `sideEffects: false`** so consumers can tree-shake. `marvin-7`, `bundler`
- **Annotate factory functions with `/**@__NO_SIDE_EFFECTS__*/`** so bundlers can tree-shake unused exports. (TSC strips comments — do it post-emit.) `fc#5786`, `fc#5771`
- **Raise TS `target` to current syntax** (e.g. ES2020+) — downleveled async/await becomes a state-machine generator that V8 optimizes worse than native. `fc#5787`
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
- **Skip intermediate artifacts when you only need the metadata.** `pacote.tarball()` + `tar.list` built a full tarball just to read filenames — `npm-packlist(tree)` returns them directly. `fc#4358`
- **Fuse traversal with config discovery.** Walking 50k directories with separate "find configs" pass costs 150k syscalls; check config names against dir entries already in hand during the work pass. `marvin-13`

---

## 9. Node.js specific

- **`sync` fs blocks the libuv pool.** Use `fsPromises` and let libuv parallelize; bump `UV_THREADPOOL_SIZE` for many large ops. `node`
- **Respect stream backpressure.** When `write()` returns `false`, wait for `'drain'`. Ignoring causes unbounded buffering → OOM. `node`
- **Prefer `pipeline()` over `pipe()`** — auto error propagation + cleanup. `node`
- **`cork()` / `nextTick(() => stream.uncork())`** to coalesce many small writes into one syscall. `node`
- **Set `highWaterMark` per-stream.** Object-mode measures objects, not bytes — default 16 may starve or flood. `node`
- **Bulk file ops over recursive walks.** Compute the keep-set up front, then `fs.rm(path, {recursive:true})` for everything else in one syscall instead of per-node stat. `fc#4388`
- **Worker pool, not one-shot Workers.** Spinup is multi-ms; amortize. Workers help CPU-bound work; I/O stays on the main loop. `node`, `fc#3239`
- **Set `resourceLimits` per Worker** — `maxOldGenerationSizeMb`, `maxYoungGenerationSizeMb`, `stackSizeMb` — runaway workers kill the host otherwise. `node`
- **Use `worker.performance.eventLoopUtilization()`** to detect saturation before latency spikes. `node`
- **`Buffer.allocUnsafe(n).fill(0)` beats `Buffer.alloc(n, 0)`** — uses the 4 KiB pool; alloc zero-fills outside it. `node`
- **`Buffer.allocUnsafeSlow` for retained small buffers** — pooled slices pin the whole 8 KiB slab in memory. `node`
- **`Buffer.concat([…], totalLength)`** — pass the total length explicitly when you know it; skips the sum pass. `node`
- **`postMessageToThread` (Node ≥20.19)** — skip parent relay for nested worker chains. `node`
- **`why-is-node-running`** — prints what keeps the loop alive when you expected exit. `node`
- **`llnode`** — walk heap from a crashed core dump; the only way to inspect state after OOM. `node`

---

## 10. Browser / DOM

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

## 11. Property-based testing & generators

- **Lazy shrink trees.** Don't materialize the whole tree; consume on demand. Otherwise shrinking a 1k-element array is O(n²) candidates. `fc-arch`
- **Contextual / resumable shrinkers.** Thread an opaque `context` so each step resumes its binary search instead of restarting. `fc#1358`, `fc#1372`, `fc#1377`, `fc#1382`, `fc#1383`, `fc#1384`, `fc#2395`
- **Avoid deep clones in property bodies.** Property runs `numRuns` times; one `structuredClone(state)` per run dominates wall time. Snapshot only what's needed. `fc-arch`
- **Structural sharing for record-style arbitraries.** Share unchanged branches across shrink candidates. `fc-arch`
- **Filter only for rare rejections.** `.filter` resamples until predicate holds; if pass-rate < 10%, encode the constraint inside `.map` or use bounded generators. `fc-arch`
- **Skip wrapper allocation when not needed.** Required-key records used `arb.map(v => ({value: v}))`; replace with sentinel + `option(arb, {nil: sentinel})` so values pass through directly. `fc#1892`
- **Drop bias coin-flip for tuples.** When `minLength === maxLength`, length can't change. `fc#2423`
- **Use SameValueZero comparator for `set`/`uniqueArray`** when the natural equality matches `Map`/`Set` semantics — enables the O(1) native-Set-backed path instead of O(n²) custom-comparator scan. `fc#2617`, `fc#2603`, `fc#2600`

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
| Closures inside hot functions | top-level fn + explicit args | `marvin-1`, `fc#1943` |
| `rule.toString().match(...)` per node | source-level pre-check first | `marvin-1` |
| Validate then parse | parse only (let parser reject) | `marvin-12` |
| Strings as data (semver versions) | real structs | `marvin-12` |
| `require('object.assign')(...)` | `Object.assign(...)` | `marvin-6` |
| Barrel re-export imports | deep imports + `exports` subpaths | `marvin-7`, `fc#6661` |
| Re-parsing what you'll regenerate (PostCSS in Tailwind) | bypass + emit directly | `marvin-8` |
| Allocating vnodes for static JSX | compile-time templates | `marvin-9` |
| Inferring `.d.ts` types per build | explicit return types + isolated decls | `marvin-10` |
| JSON across native↔JS | shared buffer + lazy facade | `marvin-11` |
| Separate pre-scan + work pass | single fused traversal | `marvin-13` |
| Top-level `require` of fat modules | lazy require per subcommand | `marvin-4` |
| Caches with low hit-rate | fix the algorithm | `marvin-12` |
| Minified source in npm | ship readable | `marvin-3` |
| Long ancestor walks for module resolution | memoize resolutions | `marvin-2` |
| `await syncValue` | branch on thenable, return otherwise | `fc#6475`, `fc#6474` |
| `output == null` | `output === undefined` | `fc#5583`, `fc#4471` |
| Truthy check on options | `=== true` / `!== undefined` | `fc#5677`, `fc#5676` |
| `typeof BigInt === 'undefined'` guard | delete after min-runtime bump | `fc#5612`, `fc#5617` |
| Anonymous class per call | top-level class | `fc#1264` |
| Generic `readOrDefault(p, key, d)` | inline ternaries | `fc#5676`, `fc#5677` |
| Recompute factory output per call | module-level lazy singleton | `fc#5678`, `fc#5402` |
| `Math.floor(n / 32)` | `n >> 5` | `fc#4098` |
| `Math.floor(Math.log(x) / Math.log(10))` | `~~(Math.log(x) * LOG10_INV)` | `fc#3551` |
| `arr.slice().reverse()` | reverse-index `for` | `fc#6448` |
| `Array(n).join(s)` | `s.repeat(n-1)` | `fc#6448` |
| `[...].map(f).reduce(...)` | fused single loop | `fc#4091` |
| `rng.jump()` (returns new) | `rng.unsafeJump()` (mutates) | `fc#3563`, `fc#1953` |
| `defineProperty(this, 'value', {get})` always | branch on need-to-clone | `fc#1948`, `fc#1946` |
| `Object.keys(o).forEach` | `for (const k in o)` (when safe) | `fc#1265` |
| `arr.includes(x)` for reused haystack | `Set` lookup | `general`, `fc#5372` |
| Linear scan over cumulative sums | precomputed array + binary search | `fc#5386` |
| `yield*` on hot path | explicit `for` + extracted fn | `fc#3564` |
| `Error.stack` read on every failure | defer to format time | `fc#5584`, `fc#4472` |
| `safeApply` always | identity-check + direct call fast path | `fc#3112`, `fc#3105` |
| `try/catch` chain in `safeApply` | `try { f.apply } catch {}` + identity compare | `fc#3105` |
| Defensive `slice()` for consume-once | return internal array | `fc#3100` |
| Animating `top/left` | animate `transform` | `web` |
| `scrollTop` polling | `IntersectionObserver` | `web` |
| `setTimeout(fn, 16)` for animation | `requestAnimationFrame` | `web` |
| Reading layout props inside write loop | batch reads, then writes | `web` |
| `new Array(n)` (holes) | `Array.from({length:n}, () => 0)` | `v8` |
| `delete obj.prop` | `obj.prop = undefined` | `v8` |
| Generic function for many shapes | N specialized monomorphic copies | `fc#1264`, `fc#1354`, `fc#3112` |
| `Buffer.alloc(n, 0)` | `Buffer.allocUnsafe(n).fill(0)` | `node` |
| Spawning a Worker per task | Worker pool | `node`, `fc#3239` |
| `pipe()` on streams | `pipeline()` | `node` |
| `await` in `for` loop | `Promise.all(xs.map(f))` (capped) | `general` |
| `Promise.resolve().then(fn)` | `queueMicrotask(fn)` | `node` |
| `setTimeout(0)` to yield | `scheduler.yield()` / `postTask` | `web` |
| Unbounded `Promise.all` | `p-limit` semaphore | `general` |

---

## Sources

- fast-check ⚡️ PRs in `dubzzz/fast-check` (run `gh pr list --search "⚡️ in:title"` for the full set).
- Marvin Hagemeister, "Speeding up the JavaScript ecosystem" parts 1–13: <https://marvinh.dev/blog/>
- V8 internals references: <https://github.com/thlorenz/v8-perf>, V8 blog posts (`v8.dev/blog`).
- Node.js docs: `nodejs.org/api/{stream,buffer,worker_threads,perf_hooks}.html`.
- Bluebird Optimization Killers wiki.
- Paul Irish's "What forces layout / reflow" gist.
- Esbuild architecture docs.
- web.dev / GoogleChrome `web-vitals`.
- Clinic.js, 0x, `--cpu-prof`/`--heap-prof` docs.
