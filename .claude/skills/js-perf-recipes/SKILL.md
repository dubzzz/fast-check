---
name: js-perf-recipes
description: Catalogue of micro and macro JavaScript/TypeScript performance recipes distilled from fast-check's ⚡️-tagged PRs (2020-2026). Use when reviewing hot-path code, hunting allocation churn, looking to shave microtasks off async pipelines, defending against prototype poisoning without paying for it, or generally asking "how could this loop / arbitrary / scheduler be faster?". Each recipe links back to the PR(s) that introduced it so you can read the original diff.
---

# JS Performance Recipes (from fast-check ⚡️ PRs)

These recipes were extracted from 80+ merged optimization PRs in
[`dubzzz/fast-check`](https://github.com/dubzzz/fast-check). They are written
as *generic* JavaScript / TypeScript advice — fast-check just happens to be a
library where the same hot paths are exercised millions of times per test
run, so every kind of micro-optimization eventually shows up.

The recipes are grouped by theme. Each entry cites the PR(s) it came from so
you can dig deeper.

---

## 1. Stop paying for async when the work is synchronous

A pure `async` function always returns a Promise and forces at least one
microtask hop. Inside a hot loop (predicate runs, scheduler ticks, generator
calls), that's death by a thousand cuts.

### 1.1 Return `T | Promise<T>` instead of always-async
PRs [#6474][], [#6475][]

```ts
// Before — every call goes through the microtask queue
async run(v) {
  const out = await this.predicate(v);
  return out === true ? null : { error: ... };
}

// After — sync values stay sync, only real thenables await
run(v): R | Promise<R> {
  const r = this.predicate(v);
  if (typeof r !== 'object' || r === null) return toAnswer(r);
  return (r as Promise<unknown>).then(toAnswer, toErrorAnswer);
}
```

### 1.2 Collapse `await Promise.resolve()` chains
PRs [#5614][], [#5615][], [#4717][], [#4718][]

```ts
// Before
return Promise.resolve(taskValue).then(() => ({ done, faulty }));

// After — resolve directly
return new Promise(resolve => { resolveTask = () => resolve({ done, faulty }); });
```

### 1.3 Recursive `.then(self)` instead of `while + await`
PR [#5891][]

```ts
// Before — one microtask per loop check
while (!done) {
  for (let i = 0; i !== n; ++i) await Promise.resolve();
  if (hasWork) await waitOne();
  else break;
}

// After — chain the next iteration only when we actually have work
const tick = async () => {
  for (let i = 0; !done && i !== n; ++i) await Promise.resolve();
  if (!done && hasWork) return waitOne().then(tick);
};
```

### 1.4 Schedule lazily — register the next task in the `then` of the previous
PR [#4717][]

```ts
// Before — pre-chains every step up front, queueing many microtasks
let prev = Promise.resolve();
for (const item of items) prev = prev.then(() => schedule(item));

// After — only schedule item N+1 once N has actually resolved
const registerNext = (i, prev) => {
  if (i >= items.length) return prev.then(onDone, onFault);
  prev.then(() => registerNext(i + 1, schedule(items[i])), onFault);
};
registerNext(0, Promise.resolve());
```

---

## 2. Equality checks: pick the strict form

### 2.1 Prefer `=== undefined` over `== null` on hot paths
PRs [#5901][], [#5677][], [#5676][], [#5583][], [#4471][], [#4345][]

```ts
// Before
if (output == null) ...
if (settings.timeout != null) ...

// After
if (output === undefined) ...
if (settings.timeout !== undefined) ...
```

`==` runs the abstract-equality algorithm with coercion; `===` is a single
tag check the JIT inlines into one comparison. Standardize on `undefined` as
"absent" so you never need to also check `null`.

### 2.2 `=== true` for booleans, instead of truthy check
PR [#5677][]

```ts
// Before — also accepts 'yes', 1, [], {} ...
withSet: orDefault(settings.withSet, false),

// After — strict, and avoids the helper call
withSet: settings.withSet === true,
```

### 2.3 Strict equality probes are JIT-friendly
PR [#5901][]

```ts
// Before — ToBoolean coercion, can be megamorphic
return thenTask ? task.then(() => thenTask()) : task;

// After — single strict comparison
return thenTask !== undefined ? task.then(() => thenTask()) : task;
```

---

## 3. Eliminate intermediate allocations

### 3.1 Reverse iteration without `slice().reverse()`
PR [#6448][]

```ts
// Before — allocates two throwaway arrays
for (const t of arr.slice().reverse()) ...

// After
for (let i = arr.length - 1; i >= 0; --i) { const t = arr[i]; ... }
```

### 3.2 `String#repeat` instead of `Array(n).join(sep)`
PR [#6448][]

```ts
// Before
const pad = Array(n).join('. ');
// After
const pad = '. '.repeat(Math.max(0, n - 1));
```

### 3.3 `+` concatenation beats `[...].join('')`
PR [#4088][]

```ts
// Before — array allocated just to be joined
return [a, b, c].join('');
// After — engines collapse these into cons-strings
return a + b + c;
```

### 3.4 Single-pass parse instead of `split().map().reduce()`
PR [#4091][]

```ts
// Before — 2 intermediate arrays, 3 callbacks per char
return s.split('').map(c => table[c]).reduce((p, c, i, a) =>
  p + c * Math.pow(32, a.length - 1 - i), 0);

// After — one for-loop, no allocation
let acc = 0, power = 1;
for (let i = s.length - 1; i >= 0; --i) {
  acc += table[s[i]] * power; power *= 32;
}
return acc;
```

### 3.5 `for..in` instead of `Object.keys().forEach`
PR [#1265][]

```ts
// Before
Object.keys(model).forEach(k => use(model[k])); // allocates a keys array
// After
for (const k in model) use(model[k]);
```

### 3.6 Skip defensive copies when you own the data
PRs [#3100][], [#3563][], [#1953][]

```ts
// Before — defensive .slice()
return items.slice();
// After — if no one else holds a ref, return as-is
return items;
```

The general pattern: provide "unsafe" *mutate-in-place* variants for callers
who own the value, and only clone at the public boundary.

---

## 4. Memoize at module scope

### 4.1 Cache idempotent factory results
PRs [#5402][], [#5678][], [#5389][]

```ts
// Before — same arbitrary rebuilt on each call
function hexa() { return integer({ min: 0, max: 15 }).map(toHex); }

// After — instantiate once, return forever
let cached;
function hexa() { return (cached ??= integer({ min: 0, max: 15 }).map(toHex)); }
```

Pre-cached `.slice(0, n)` results, pre-computed lookup tables, and shared
sub-arbitraries all fall under the same recipe.

### 4.2 Hoist closures and bound methods out of hot paths
PRs [#1943][], [#4092][], [#1264][]

```ts
// Before — fresh arrow allocated per shrink step
ctx.shrink().map(s => new NextValue(s.value_, s, () => s.value));

// After — single module-level helper, reused
function toNext(s) { return new NextValue(s.value_, s, () => s.value); }
ctx.shrink().map(toNext);
```

Same idea: don't build a `(n) => buildPaddedMapper(n)` partial on every call
— freeze the common `n` at module load.

### 4.3 Cache built-in references in module scope
PR [#4921][]

```ts
// At module top
const safeIsInteger = Number.isInteger;
const safeIs = Object.is;
// Hot path
if (safeIsInteger(x)) ...
```

Removes per-call property lookup, makes the call monomorphic, and as a
side-effect hardens against prototype poisoning.

---

## 5. Help the bundler help your users

### 5.1 `/*#__PURE__*/` on factory calls
PRs [#5771][], [#5786][]

```ts
// Before — bundler can't prove the call is side-effect free
export const myArb = buildArb(opts);

// After — bundler can drop the export if the consumer doesn't import it
export const myArb = /*#__PURE__*/ buildArb(opts);
```

### 5.2 Deep / subpath imports avoid evaluating barrel files
PRs [#5718][], [#6661][]

```ts
// Before — barrel file is loaded, ALL siblings evaluated
import { unsafeSkipN } from 'pure-rand';

// After — only this module's top-level runs
import { unsafeSkipN } from 'pure-rand/distribution/UnsafeSkipN';
```

### 5.3 Raise the compile target when the runtime allows
PR [#5787][]

Lifting from ES2017 → ES2020 lets the engine use native `async`/`await`,
optional chaining, nullish coalescing instead of TypeScript-emitted state
machines (which are notably slower than native ones).

---

## 6. Stop paying for feature detection you don't need

PRs [#5212][], [#5617][], [#5211][], [#5612][]

```ts
// Before — defensive guards for old engines
const SafeBigInt = typeof BigInt !== 'undefined' ? BigInt : undefined;
function mixedCase(s, flagsArb) {
  if (typeof BigInt === 'undefined') throw new Error('No bigint');
  ...
}

// After — bump baseline, drop the branch
const SafeBigInt = BigInt;
function mixedCase(s, flagsArb) { ... }
```

When you bump your minimum engine, sweep the codebase for the guards you no
longer need. Each branch removed lets the JIT specialize further.

---

## 7. Defer expensive constructions

### 7.1 Don't build `Error` instances until they're needed
PRs [#5584][], [#4472][]

V8 (and other engines) capture the stack lazily, but they still pay a
non-trivial cost when something reads `.message`/`.stack`, *and* the object
allocation itself is heavy.

```ts
// Before — wrap every failing predicate result eagerly
return { error: new Error(formatCause(cause)), formattedStack: stack(...) };

// After — keep the raw cause; only format when something asks for it
return { cause };
```

---

## 8. Pick a better algorithm or data structure

### 8.1 `Set.has` (O(1)) instead of `Array.includes` (O(N))
PR [#5372][]

```ts
// Before
if (values.includes(v)) return true;

// After
const valuesSet = new Set(values);
if (valuesSet.has(v)) return true;
```

### 8.2 Binary search on cumulative weights instead of linear scan
PR [#5386][]

```ts
// Before — O(N) per pick
for (const e of entries) { if (idx < e.num) return e; idx -= e.num; }

// After — O(log N)
const i = binarySearch(cumNums, idx);
return entries[i];
```

### 8.3 Project to a selector, not a pairwise comparator
PRs [#2603][], [#2617][]

```ts
// Before — O(n²) pairwise compare in dedupe
{ compare: (a, b) => a[0] === b[0] }
// After — O(1) hash lookup via Set/Map
{ compare: { selector: t => t[0] } }
```

### 8.4 Fast-path the default config with a native data structure
PR [#2600][]

```ts
if (constraints.compare !== undefined)
  return () => new CustomEqualSet(isEqualForBuilder); // slow generic path
return () => new StrictlyEqualSet(extractor); // native-Set-backed fast path
```

### 8.5 Iterative halving instead of recursive shrink trees
PRs [#1358][], [#1372][]

```ts
// Before — recursive Shrinkable tree, lots of allocs
// After — flat halving stream with a tiny context
function* shrinkInt(value, target) {
  let gap = value - target;
  while (gap !== 0) { gap = (gap / 2) | 0; yield target + gap; }
}
```

### 8.6 Bit-level reinterpretation for float shrinking
PR [#1384][]

```ts
// Walk the int64 bit pattern instead of recomputing doubles
const bits = doubleToRawInt64Bits(v);
for (const smaller of intShrinker(bits)) yield int64BitsToDouble(smaller);
```

---

## 9. Math micro-optimizations

### 9.1 Bit shifts over `Math.floor(n / 2**k)` / `n % 2**k`
PR [#4098][]

```ts
// Before
const next = Math.floor(remaining / 32);
const current = remaining % 32;

// After (for non-negative 32-bit values)
const next = remaining >> 5;
const current = remaining - (next << 5);
```

### 9.2 `~~x` instead of `Math.floor(x)` for small positive numbers
PR [#3551][]

```ts
// Before
const n = 2 + Math.floor(Math.log(runId + 1) / Math.log(10));
// After — also hoists the constant 1/ln(10)
const n = 2 + ~~(Math.log(runId + 1) * 0.43429448190325176);
```

### 9.3 Replace `Math.pow`/`Math.log` loops with modulo/division loops
PR [#4092][]

```ts
// Before — recompute Math.pow(32, k) every step
for (let k = digits; k > 0; k--) {
  const v = Math.pow(32, k - 1);
  out += encode(Math.floor(remaining / v));
  remaining -= Math.floor(remaining / v) * v;
}

// After
for (let r = num; r !== 0; r = Math.floor(r / 32)) out = encode(r % 32) + out;
```

---

## 10. Specialize hot loops

### 10.1 Split a polymorphic loop into two monomorphic ones
PR [#1996][]

```ts
// Before — checks isEqual on every iteration
while (items.length < target) {
  const v = arb.generate(mrng);
  if (isEqual === undefined || !items.some(x => isEqual(x, v))) items.push(v);
}

// After — choose the loop once
const items = isEqual !== undefined
  ? generateNoDuplicates(target, mrng)
  : generateAny(target, mrng);
```

### 10.2 Drop unused flexibility from generic algorithms
PR [#5387][]

If callers rarely use a parameter, parameterizing every iteration on it is
pure overhead. Specialize on the common case and filter out the rare one
afterwards.

### 10.3 Short-circuit no-op operations
PR [#3552][]

```ts
drop(n) {
  if (n <= 0) return this;          // fast path
  return new Stream(this[Symbol.iterator](), skip(n));
}
```

### 10.4 Skip the dice roll when there's only one outcome
PR [#2423][]

```ts
// Before — bias-coin flipped even though min === max
if (mrng.nextInt(1, biasFactor) !== 1) { ... }

// After
if (this.minLength === this.maxLength) {
  return { size: this.lengthArb.generate(mrng).value, biasFactorItems: biasFactor };
}
```

---

## 11. JIT pitfalls

### 11.1 Hoist anonymous classes — they break hidden-class sharing
PR [#1264][]

```ts
// Before — fresh class object created at every call site
map(fn) {
  const arb = this;
  return new (class extends Arb { generate(r) { return arb.generate(r).map(fn); } })();
}

// After — one module-level class, single hidden shape
map(fn) { return new MapArbitrary(this, fn); }
class MapArbitrary<T,U> extends Arb<U> { ... }
```

### 11.2 Split polymorphic helpers into per-type versions
PR [#1354][]

```ts
// Before — number | bigint forces runtime type check
function shrinkNumeric(v: number | bigint, t: number | bigint) { ... }
// After — each version stays monomorphic
function shrinkInt(v: number, t: number) { ... }
function shrinkBigInt(v: bigint, t: bigint) { ... }
```

### 11.3 Avoid `yield*` in hot generators
PR [#3564][]

`yield*` triggers V8 bailout deopts. When the delegated generator is small
or known, inline the iteration.

```ts
// Before
function* run() { yield* toss(arb); }
// After
function* run() { for (const v of toss(arb)) yield v; }
```

### 11.4 Plain property vs. `Object.defineProperty(get)`
PRs [#1945][], [#1946][], [#1948][]

A getter is much slower than a direct property assignment. Only install one
when the cloneable case actually requires it.

```ts
if (this.hasToBeCloned) {
  Object.defineProperty(this, 'value', { get: () => clone(value_) });
} else {
  this.value = value_;
}
```

---

## 12. Mutate in place, clone at the boundary

PRs [#1953][], [#3563][], [#3100][]

```ts
// Before — pure-rand v3 immutable API: every draw allocates
const [n, next] = prand.uniformIntDistribution(min, max, this.rng);
this.rng = next;
return n;

// After — own a private mutable copy, use unsafe* methods, clone once
return prand.unsafeUniformIntDistribution(min, max, this.rng); // mutates this.rng
```

If a function is the *only* writer of an object, treat the immutability
contract as a boundary concern, not a per-call concern.

---

## 13. Short-circuit adapter layers

### 13.1 Skip A→B→A round trips
PR [#1944][]

```ts
// If we already speak the inner protocol, call it directly
if (ConverterFromNext.isConverterFromNext(this.arb))
  return this.arb.toShrinkable(this.arb.arb.generate(mrng, bias));
return this.arb.generate(mrng);
```

### 13.2 Sentinel value instead of wrapper object
PR [#1892][]

```ts
// Before — wraps every value in { value } just so null can mean "absent"
const arb = recordModel[k].map(v => ({ value: v }));
arbs.push(option(arb));
// ... later: if (w !== null) obj[k] = w.value;

// After — pass a unique Symbol as the "nil" marker
const noKeyValue = Symbol('no-key');
arbs.push(option(recordModel[k], { nil: noKeyValue }));
// ... later: if (w !== noKeyValue) obj[k] = w;
```

### 13.3 Push invariants to the caller
PR [#1917][]

```ts
// Before — redundant guard inside a function the contract already validates
const u = this.unmapper(v);
if (this.arb.canShrinkWithoutContext(u))
  return this.arb.shrink(u).map(this.bindValueMapper);
return Stream.nil();

// After — trust the contract
return this.arb.shrink(this.unmapper(v)).map(this.bindValueMapper);
```

### 13.4 Reject duplicates while generating, not after
PR ["Faster implementation for set"][1020-ref]

```ts
// Before — generate N, then filter → may return fewer than asked
// After — generate-and-test with a reject counter as a circuit breaker
while (items.length < target && skipped < maxLength) {
  const c = arb.generate(mrng);
  if (canAppend(items, c)) { items.push(c); skipped = 0; }
  else skipped++;
}
```

---

## 14. Normalize once, at the boundary

PRs [#2975][], [#5676][]

If user options can be missing/null/any-shape, don't sprinkle
`opts?.x ?? default` everywhere — sanitize once at the public entry and pass
a guaranteed-shape internal object downstream.

```ts
// Internal code stops branching on shape
const sanitized = { depth: opts?.depth ?? defaultDepth, withSet: opts?.withSet === true };
internal(sanitized);
```

Same idea for "read this parameter": inline the read at the call site
(monomorphic) instead of going through a `readOrDefault(p, key, def)` helper
(megamorphic).

---

## 15. Pool heavy resources, pre-filter expensive comparisons

### 15.1 Worker pools across predicate runs
PR [#3239][]

Spawning a Worker per call has fixed startup cost. Reuse them across runs
and terminate only when state is compromised (e.g. timeout).

### 15.2 Cheap pre-filter before expensive equality
PR [#3317][]

```ts
// Before — deep-compare every item × every diff candidate
// After — cheap eligibility tag filter first, deep compare only survivors
const candidates = all.filter(cheapEligibilityCheck);
for (const c of candidates) deepCompare(c, target);
```

---

## 16. Defending against prototype poisoning — *cheaply*

PRs [#3105][], [#3112][]

Naive "safe" wrappers walk descriptors (`Object.getOwnPropertyDescriptor`,
`getPrototypeOf`) on every call — that's brutally slow. Cache the original
method once, identity-check on entry, and call it directly. Fall back to
descriptor walking only on the rare tampered case.

```ts
const origPush = Array.prototype.push;
export function safePush(arr, v) {
  if (arr.push === origPush) return arr.push(v);         // fast path
  return Reflect.apply(origPush, arr, [v]);              // slow, rare
}
```

The same try/catch identity-probe trick replaces a chain of property
descriptor reads in `safeApply` for a ~4× speedup.

---

## 17. Shrinking-specific recipes (still useful elsewhere)

### 17.1 Thread a typed *context* through recursive operations
PRs [#1377][], [#1382][]

Replace boolean "have we shrunk once?" flags with an opaque context value
the inner operation produces and the outer one feeds back in. This lets the
inner operation resume from where it left off across calls.

### 17.2 Shrink the small derived state, not the wrapped value
PR [#1383][]

For transformations that layer randomness on top of an existing arbitrary
(e.g. case toggles, padding, options), shrink only the small derived state
separately and let the inner arbitrary handle its own shrinking.

### 17.3 Teach shrinkers your structural constraints
PR [#2395][]

A shrinker that ignores `minLength` wastes work generating candidates that
will be rejected. Encode invariants once so the shrinker stays inside the
valid region.

### 17.4 Use `letrec` over `memo` for mutually-recursive definitions
PR [#2309][]

`letrec` builds one graph of refs; `memo` lazily rebuilds and caches per call
site. Reach for `letrec` when defining recursive structures.

---

## 18. Free wins: keep your dependencies fresh

PRs [#3547][], [#6679][], [#6689][]

Hot-path libraries (RNGs, parsers, hashers) routinely ship measurable
speedups in major versions. Renovate/Dependabot earns its keep when the dep
is called millions of times per run.

---

## Quick checklist

When you suspect a hot path is slower than it needs to be, run through this
list:

- [ ] Could this `async`/`await` be `T | Promise<T>` instead? (§1)
- [ ] Any `== null` / `if (x)` that could be `=== undefined` / `=== true`? (§2)
- [ ] Any `.slice().reverse()`, `Array(n).join`, `split().map().reduce()`? (§3)
- [ ] Any factory that gets called more than once with the same args? (§4)
- [ ] Any `export const x = factory()` that's not `/*#__PURE__*/`? (§5.1)
- [ ] Any barrel imports we could deep-import? (§5.2)
- [ ] Any `typeof X !== 'undefined'` guards we no longer need? (§6)
- [ ] Any `new Error()` built on the success path? (§7)
- [ ] Any `Array.includes` on >10 items, repeated? Use a `Set`. (§8.1)
- [ ] Any `Math.floor(n / 2^k)` / `Math.pow(2, k)` we can bit-shift? (§9)
- [ ] Any loop checking the same flag every iteration? Split it. (§10.1)
- [ ] Any anonymous `class` returned from a method? Hoist it. (§11.1)
- [ ] Any defensive `slice()` whose result we own? (§3.6, §12)
- [ ] Any per-iteration option-defaulting we could do once at the entry? (§14)
- [ ] Any "safe" wrapper that walks descriptors instead of identity-checking? (§16)

---

## Source PRs

[#1264]: https://github.com/dubzzz/fast-check/pull/1264 "Extract inlined-classes outside of Arbitrary base-class"
[#1265]: https://github.com/dubzzz/fast-check/pull/1265 "Switch from Object.keys to for..in in record"
[#1354]: https://github.com/dubzzz/fast-check/pull/1354 "Split shrinkNumeric into two specific functions"
[#1358]: https://github.com/dubzzz/fast-check/pull/1358 "Switch towards a faster shrinker for integer"
[#1372]: https://github.com/dubzzz/fast-check/pull/1372 "Switch towards a faster shrinker for bigint"
[#1377]: https://github.com/dubzzz/fast-check/pull/1377 "Re-use the context of integer during shrink of an array"
[#1382]: https://github.com/dubzzz/fast-check/pull/1382 "More efficient shrinker on subarray"
[#1383]: https://github.com/dubzzz/fast-check/pull/1383 "More efficient shrinker on mixedCase"
[#1384]: https://github.com/dubzzz/fast-check/pull/1384 "More efficient shrinker on double"
[#1892]: https://github.com/dubzzz/fast-check/pull/1892 "Remove unneeded map in record for required keys"
[#1917]: https://github.com/dubzzz/fast-check/pull/1917 "Remove unneeded checks in map for context-less shrink"
[#1943]: https://github.com/dubzzz/fast-check/pull/1943 "Try to optimize conversions from/to NextValue"
[#1944]: https://github.com/dubzzz/fast-check/pull/1944 "Call generate on the NextArbitrary from Property"
[#1945]: https://github.com/dubzzz/fast-check/pull/1945 "Faster generate for constant and constantFrom"
[#1946]: https://github.com/dubzzz/fast-check/pull/1946 "Speed-up conversions from/to NextValue"
[#1948]: https://github.com/dubzzz/fast-check/pull/1948 "More performant non-cloneable values in NextValue"
[#1953]: https://github.com/dubzzz/fast-check/pull/1953 "Speed-up random by using unsafe methods of pure-rand"
[#1996]: https://github.com/dubzzz/fast-check/pull/1996 "Fork paths of array/set in ArrayArbitrary::generate"
[1020-ref]: https://github.com/dubzzz/fast-check/pull/1020 "Faster implementation for set"
[#2309]: https://github.com/dubzzz/fast-check/pull/2309 "Lighter implementation for anything arbitrary"
[#2395]: https://github.com/dubzzz/fast-check/pull/2395 "Better shrinker for arrays requested minLength"
[#2423]: https://github.com/dubzzz/fast-check/pull/2423 "Make fixed sized arrays as biased as tuples"
[#2600]: https://github.com/dubzzz/fast-check/pull/2600 "Improve performance of set"
[#2603]: https://github.com/dubzzz/fast-check/pull/2603 "Switch to optimized compare of set internally"
[#2617]: https://github.com/dubzzz/fast-check/pull/2617 "Use relevant comparator to build anything"
[#2975]: https://github.com/dubzzz/fast-check/pull/2975 "Sanitize constraints used internally by oneof"
[#3100]: https://github.com/dubzzz/fast-check/pull/3100 "Drop unneeded copy for full custom uniqueArray"
[#3105]: https://github.com/dubzzz/fast-check/pull/3105 "Faster implementation for safeApply"
[#3112]: https://github.com/dubzzz/fast-check/pull/3112 "Speed-up all safe versions built-in methods"
[#3239]: https://github.com/dubzzz/fast-check/pull/3239 "Share workers across runs of the predicate"
[#3317]: https://github.com/dubzzz/fast-check/pull/3317 "Faster diff tracking with pre-filtering"
[#3547]: https://github.com/dubzzz/fast-check/pull/3547 "Slightly faster thanks to pure-rand v6"
[#3551]: https://github.com/dubzzz/fast-check/pull/3551 "Faster implementation of runIdToFrequency"
[#3552]: https://github.com/dubzzz/fast-check/pull/3552 "Do not wrap stream when dropping 0 items"
[#3553]: https://github.com/dubzzz/fast-check/pull/3553 "Drop useless internal stream conversions"
[#3554]: https://github.com/dubzzz/fast-check/pull/3554 "Tosser must immediately produce values"
[#3563]: https://github.com/dubzzz/fast-check/pull/3563 "Mutate rng inplace in tosser"
[#3564]: https://github.com/dubzzz/fast-check/pull/3564 "Drop bailout linked to toss"
[#4088]: https://github.com/dubzzz/fast-check/pull/4088 "Drop some unneeded allocs in ulid"
[#4091]: https://github.com/dubzzz/fast-check/pull/4091 "Faster unmap for ulid"
[#4092]: https://github.com/dubzzz/fast-check/pull/4092 "Faster generation of ulid"
[#4098]: https://github.com/dubzzz/fast-check/pull/4098 "Faster ulid mapper function"
[#4345]: https://github.com/dubzzz/fast-check/pull/4345 "Faster replay: drop loose compare"
[#4471]: https://github.com/dubzzz/fast-check/pull/4471 "Faster property::run with strict equality checks"
[#4472]: https://github.com/dubzzz/fast-check/pull/4472 "Delay computation of Error stack"
[#4717]: https://github.com/dubzzz/fast-check/pull/4717 "Faster scheduling of scheduleSequence"
[#4718]: https://github.com/dubzzz/fast-check/pull/4718 "Speed-up race-condition schedulers"
[#4921]: https://github.com/dubzzz/fast-check/pull/4921 "More optimal noInteger on double"
[#5211]: https://github.com/dubzzz/fast-check/pull/5211 "Drop unneeded BigInt check in mixedCase"
[#5212]: https://github.com/dubzzz/fast-check/pull/5212 "Faster initialization of globals by dropping typeof checks"
[#5372]: https://github.com/dubzzz/fast-check/pull/5372 "Faster canShrinkWithoutContext for constants"
[#5386]: https://github.com/dubzzz/fast-check/pull/5386 "Faster generate process for mapToConstant"
[#5387]: https://github.com/dubzzz/fast-check/pull/5387 "Faster tokenizer of strings"
[#5388]: https://github.com/dubzzz/fast-check/pull/5388 "Faster initialization of string with faster slices"
[#5389]: https://github.com/dubzzz/fast-check/pull/5389 "Faster initialization of string with pre-cached slices"
[#5402]: https://github.com/dubzzz/fast-check/pull/5402 "Faster instantiation of internet-related arbitraries"
[#5583]: https://github.com/dubzzz/fast-check/pull/5583 "Faster property::run with strict equality checks"
[#5584]: https://github.com/dubzzz/fast-check/pull/5584 "Delay computation of Error stack when no cause"
[#5612]: https://github.com/dubzzz/fast-check/pull/5612 "Drop unneeded BigInt check in mixedCase"
[#5614]: https://github.com/dubzzz/fast-check/pull/5614 "Faster scheduling of scheduleSequence"
[#5615]: https://github.com/dubzzz/fast-check/pull/5615 "Speed-up race-condition schedulers"
[#5617]: https://github.com/dubzzz/fast-check/pull/5617 "Faster initialization of globals by dropping typeof checks"
[#5676]: https://github.com/dubzzz/fast-check/pull/5676 "Faster read of parameters passed to runners"
[#5677]: https://github.com/dubzzz/fast-check/pull/5677 "Faster read of constraints on object and related"
[#5678]: https://github.com/dubzzz/fast-check/pull/5678 "Faster ipV6 generation with cached string builders"
[#5718]: https://github.com/dubzzz/fast-check/pull/5718 "Import less from pure-rand"
[#5771]: https://github.com/dubzzz/fast-check/pull/5771 "Mark all arbitraries as side-effect free (first cut)"
[#5786]: https://github.com/dubzzz/fast-check/pull/5786 "Mark all arbitraries as side-effect free"
[#5787]: https://github.com/dubzzz/fast-check/pull/5787 "Target ES2020 in produced bundle"
[#5891]: https://github.com/dubzzz/fast-check/pull/5891 "Move back to better tick management of waitFor"
[#5901]: https://github.com/dubzzz/fast-check/pull/5901 "Slightly faster scheduler with explicit undefined check"
[#6448]: https://github.com/dubzzz/fast-check/pull/6448 "Optimize RunDetailsFormatter array allocations"
[#6474]: https://github.com/dubzzz/fast-check/pull/6474 "Avoid async when doable in asyncProperty"
[#6475]: https://github.com/dubzzz/fast-check/pull/6475 "Avoid async code path when doable in runner"
[#6661]: https://github.com/dubzzz/fast-check/pull/6661 "Import less from pure-rand (worker)"
[#6679]: https://github.com/dubzzz/fast-check/pull/6679 "Bump pure-rand to v8"
[#6689]: https://github.com/dubzzz/fast-check/pull/6689 "Bump pure-rand to v8 (worker)"
