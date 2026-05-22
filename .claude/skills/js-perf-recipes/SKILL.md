---
name: js-perf-recipes
description: Catalogue of micro and macro JavaScript/TypeScript performance recipes. Use when reviewing hot-path code, hunting allocation churn, looking to shave microtasks off async pipelines, defending against prototype poisoning without paying for it, or generally asking "how could this loop / function / pipeline be faster?".
---

# JS Performance Recipes

A pragmatic catalogue of JavaScript / TypeScript optimization recipes for
hot-path code. Each recipe gives a small before/after snippet and a one-line
rationale. The advice is generic JS — applicable to any library, runtime, or
application code where the same path is exercised many times.

---

## 1. Stop paying for async when the work is synchronous

A pure `async` function always returns a Promise and forces at least one
microtask hop, even when the body is fully synchronous. Inside a hot loop,
that's death by a thousand cuts.

### 1.1 Return `T | Promise<T>` instead of always-async

```ts
// Before — every call goes through the microtask queue
async run(v) {
  const out = await this.fn(v);
  return out === true ? null : { error: ... };
}

// After — sync values stay sync, only real thenables await
run(v): R | Promise<R> {
  const r = this.fn(v);
  if (typeof r !== 'object' || r === null) return toAnswer(r);
  return (r as Promise<unknown>).then(toAnswer, toErrorAnswer);
}
```

### 1.2 Collapse `await Promise.resolve()` chains

```ts
// Before
return Promise.resolve(taskValue).then(() => ({ done, faulty }));

// After — resolve directly
return new Promise(resolve => { resolveTask = () => resolve({ done, faulty }); });
```

### 1.3 Recursive `.then(self)` instead of `while + await`

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

```ts
// Before — also accepts 'yes', 1, [], {} ...
withSet: orDefault(settings.withSet, false),

// After — strict, and avoids the helper call
withSet: settings.withSet === true,
```

### 2.3 Strict equality probes are JIT-friendly

```ts
// Before — ToBoolean coercion, can deopt megamorphic call sites
return thenTask ? task.then(() => thenTask()) : task;

// After — single strict comparison
return thenTask !== undefined ? task.then(() => thenTask()) : task;
```

---

## 3. Eliminate intermediate allocations

### 3.1 Reverse iteration without `slice().reverse()`

```ts
// Before — allocates two throwaway arrays
for (const t of arr.slice().reverse()) ...

// After
for (let i = arr.length - 1; i >= 0; --i) { const t = arr[i]; ... }
```

### 3.2 `String#repeat` instead of `Array(n).join(sep)`

```ts
// Before
const pad = Array(n).join('. ');
// After
const pad = '. '.repeat(Math.max(0, n - 1));
```

### 3.3 `+` concatenation beats `[...].join('')`

```ts
// Before — array allocated just to be joined
return [a, b, c].join('');
// After — engines collapse these into cons-strings
return a + b + c;
```

### 3.4 Single-pass parse instead of `split().map().reduce()`

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

```ts
// Before
Object.keys(model).forEach(k => use(model[k])); // allocates a keys array
// After
for (const k in model) use(model[k]);
```

### 3.6 Skip defensive copies when you own the data

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

```ts
// Before — same heavy object rebuilt on each call
function buildValidator() { return new Validator(rules); }

// After — instantiate once, return forever
let cached;
function buildValidator() { return (cached ??= new Validator(rules)); }
```

Pre-cached slices, pre-computed lookup tables, and shared sub-components all
fall under the same recipe.

### 4.2 Hoist closures and bound methods out of hot paths

```ts
// Before — fresh arrow allocated per call
items.map(s => new Wrapper(s.value, s, () => s.expensive()));

// After — single module-level helper, reused
function toWrapper(s) { return new Wrapper(s.value, s, () => s.expensive()); }
items.map(toWrapper);
```

Same idea: don't build a `(n) => buildMapper(n)` partial on every call —
freeze the common `n` at module load.

### 4.3 Cache built-in references in module scope

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

```ts
// Before — bundler can't prove the call is side-effect free
export const myThing = build(opts);

// After — bundler can drop the export if the consumer doesn't import it
export const myThing = /*#__PURE__*/ build(opts);
```

### 5.2 Deep / subpath imports avoid evaluating barrel files

```ts
// Before — barrel file is loaded, ALL siblings evaluated
import { thing } from 'some-pkg';

// After — only this module's top-level runs
import { thing } from 'some-pkg/sub/Thing';
```

### 5.3 Raise the compile target when the runtime allows

Lifting from ES2017 → ES2020 lets the engine use native `async`/`await`,
optional chaining, nullish coalescing instead of transpiler-emitted state
machines (which are notably slower than native ones).

---

## 6. Stop paying for feature detection you don't need

```ts
// Before — defensive guards for old engines
const SafeBigInt = typeof BigInt !== 'undefined' ? BigInt : undefined;
function caseMixer(s) {
  if (typeof BigInt === 'undefined') throw new Error('No bigint');
  ...
}

// After — bump baseline, drop the branch
const SafeBigInt = BigInt;
function caseMixer(s) { ... }
```

When you bump your minimum engine, sweep the codebase for the guards you no
longer need. Each branch removed lets the JIT specialize further.

---

## 7. Defer expensive constructions

### 7.1 Don't build `Error` instances until they're needed

V8 (and other engines) capture the stack lazily, but they still pay a
non-trivial cost when something reads `.message`/`.stack`, *and* the object
allocation itself is heavy.

```ts
// Before — wrap every failing result eagerly
return { error: new Error(formatCause(cause)), formattedStack: stack(...) };

// After — keep the raw cause; only format when something asks for it
return { cause };
```

---

## 8. Pick a better algorithm or data structure

### 8.1 `Set.has` (O(1)) instead of `Array.includes` (O(N))

```ts
// Before
if (values.includes(v)) return true;

// After
const valuesSet = new Set(values);
if (valuesSet.has(v)) return true;
```

### 8.2 Binary search on cumulative weights instead of linear scan

```ts
// Before — O(N) per pick
for (const e of entries) { if (idx < e.weight) return e; idx -= e.weight; }

// After — O(log N)
const i = binarySearch(cumWeights, idx);
return entries[i];
```

### 8.3 Project to a selector, not a pairwise comparator

```ts
// Before — O(n²) pairwise compare in dedupe
items.filter((a, i) => items.findIndex(b => a.id === b.id) === i);

// After — O(n) hash lookup via Set/Map
const seen = new Set();
const out = [];
for (const a of items) if (!seen.has(a.id)) { seen.add(a.id); out.push(a); }
```

### 8.4 Fast-path the default config with a native data structure

```ts
if (config.compare !== undefined)
  return new CustomEqualSet(config.compare);  // slow generic path
return new StrictlyEqualSet();                // native-Set-backed fast path
```

### 8.5 Iterative halving instead of recursive trees

When narrowing a numeric value toward a target, a flat halving stream beats
a recursive tree of candidates — same minimum, far fewer allocations.

```ts
function* halveToward(value, target) {
  let gap = value - target;
  while (gap !== 0) { gap = (gap / 2) | 0; yield target + gap; }
}
```

### 8.6 Bit-level reinterpretation for float manipulation

Walk the IEEE-754 bit pattern of a `number` (via a small `DataView` /
`Float64Array` aliased buffer) instead of recomputing doubles by arithmetic.
Each step becomes O(1) integer work.

```ts
const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const i32 = new Int32Array(buf);
f64[0] = value;
// mutate i32[0]/i32[1] then read f64[0] back
```

---

## 9. Math micro-optimizations

### 9.1 Bit shifts over `Math.floor(n / 2**k)` / `n % 2**k`

```ts
// Before
const next = Math.floor(remaining / 32);
const current = remaining % 32;

// After (for non-negative 32-bit values)
const next = remaining >> 5;
const current = remaining - (next << 5);
```

### 9.2 `~~x` instead of `Math.floor(x)` for small positive numbers

```ts
// Before
const n = 2 + Math.floor(Math.log(id + 1) / Math.log(10));
// After — also hoists the constant 1/ln(10)
const n = 2 + ~~(Math.log(id + 1) * 0.43429448190325176);
```

### 9.3 Replace `Math.pow`/`Math.log` loops with modulo/division loops

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

```ts
// Before — checks the same flag on every iteration
while (items.length < target) {
  const v = next();
  if (isEqual === undefined || !items.some(x => isEqual(x, v))) items.push(v);
}

// After — choose the loop once
const items = isEqual !== undefined
  ? generateNoDuplicates(target)
  : generateAny(target);
```

### 10.2 Drop unused flexibility from generic algorithms

If callers rarely use a parameter, parameterizing every iteration on it is
pure overhead. Specialize on the common case and filter out the rare one
afterwards.

### 10.3 Short-circuit no-op operations

```ts
drop(n) {
  if (n <= 0) return this;          // fast path
  return new Stream(this[Symbol.iterator](), skip(n));
}
```

### 10.4 Skip the dice roll when there's only one outcome

```ts
// Before — random branch evaluated even when only one value is possible
if (rng.nextInt(1, factor) !== 1) { ... }

// After
if (min === max) return { size: min, factor };
```

---

## 11. JIT pitfalls

### 11.1 Hoist anonymous classes — they break hidden-class sharing

```ts
// Before — fresh class object created at every call site
map(fn) {
  const self = this;
  return new (class extends Base { run(r) { return self.run(r).map(fn); } })();
}

// After — one module-level class, single hidden shape
map(fn) { return new MapNode(this, fn); }
class MapNode<T,U> extends Base<U> { ... }
```

### 11.2 Split polymorphic helpers into per-type versions

```ts
// Before — number | bigint forces runtime type check
function halve(v: number | bigint, t: number | bigint) { ... }
// After — each version stays monomorphic
function halveInt(v: number, t: number) { ... }
function halveBigInt(v: bigint, t: bigint) { ... }
```

### 11.3 Avoid `yield*` in hot generators

`yield*` triggers V8 bailout deopts. When the delegated generator is small
or known, inline the iteration.

```ts
// Before
function* run() { yield* inner(); }
// After
function* run() { for (const v of inner()) yield v; }
```

### 11.4 Plain property vs. `Object.defineProperty(get)`

A getter is much slower than a direct property assignment. Only install one
when its laziness is actually required.

```ts
if (needsLazyClone) {
  Object.defineProperty(this, 'value', { get: () => clone(value_) });
} else {
  this.value = value_;
}
```

---

## 12. Mutate in place, clone at the boundary

```ts
// Before — immutable API: every operation allocates
const [n, next] = stepImmutable(state, args);
this.state = next;
return n;

// After — own a private mutable copy, use unsafe* methods, clone once
return stepInPlace(this.state, args); // mutates this.state
```

If a function is the *only* writer of an object, treat the immutability
contract as a boundary concern, not a per-call concern.

---

## 13. Short-circuit adapter layers

### 13.1 Skip A→B→A round trips

```ts
// If we already speak the inner protocol, call it directly
if (Adapter.isAdapter(wrapped))
  return Adapter.adapt(wrapped.inner.compute(args));
return wrapped.compute(args);
```

### 13.2 Sentinel value instead of wrapper object

```ts
// Before — wraps every value in { value } just so null can mean "absent"
const arb = base.map(v => ({ value: v }));
options.push(maybe(arb));
// ... later: if (w !== null) obj[k] = w.value;

// After — pass a unique Symbol as the "nil" marker
const absent = Symbol('absent');
options.push(maybe(base, { nil: absent }));
// ... later: if (w !== absent) obj[k] = w;
```

### 13.3 Push invariants to the caller

```ts
// Before — redundant guard inside a function the contract already validates
const u = this.fn(v);
if (this.inner.canHandle(u)) return this.inner.process(u).map(this.bound);
return Stream.nil();

// After — trust the contract
return this.inner.process(this.fn(v)).map(this.bound);
```

### 13.4 Reject invalid items while generating, not after

```ts
// Before — generate N, then filter → may return fewer than asked
// After — generate-and-test with a reject counter as a circuit breaker
while (items.length < target && skipped < maxAttempts) {
  const c = next();
  if (canAppend(items, c)) { items.push(c); skipped = 0; }
  else skipped++;
}
```

---

## 14. Normalize once, at the boundary

If user options can be missing/null/any-shape, don't sprinkle
`opts?.x ?? default` everywhere — sanitize once at the public entry and pass
a guaranteed-shape internal object downstream.

```ts
// Internal code stops branching on shape
const sanitized = {
  depth: opts?.depth ?? defaultDepth,
  withSet: opts?.withSet === true,
};
internal(sanitized);
```

Same idea for "read this parameter": inline the read at the call site
(monomorphic) instead of going through a `readOrDefault(p, key, def)` helper
(megamorphic).

---

## 15. Pool heavy resources, pre-filter expensive comparisons

### 15.1 Worker pools across calls

Spawning a Worker (or any heavy resource) per call has fixed startup cost.
Reuse instances across calls and terminate only when state is compromised
(e.g. timeout).

### 15.2 Cheap pre-filter before expensive equality

```ts
// Before — deep-compare every item × every candidate
// After — cheap eligibility tag filter first, deep compare only survivors
const candidates = all.filter(cheapEligibilityCheck);
for (const c of candidates) deepCompare(c, target);
```

---

## 16. Defending against prototype poisoning — *cheaply*

Naive "safe" wrappers walk descriptors (`Object.getOwnPropertyDescriptor`,
`getPrototypeOf`) on every call — brutally slow. Cache the original method
once, identity-check on entry, and call it directly. Fall back to descriptor
walking only on the rare tampered case.

```ts
const origPush = Array.prototype.push;
export function safePush(arr, v) {
  if (arr.push === origPush) return arr.push(v);         // fast path
  return Reflect.apply(origPush, arr, [v]);              // slow, rare
}
```

The same try/catch identity-probe trick replaces a chain of property
descriptor reads in safe `apply` wrappers for a ~4× speedup.

---

## 17. Thread state through recursive operations

Replace boolean "have we done this once?" flags with an opaque context value
the inner operation produces and the outer one feeds back in. This lets the
inner operation resume from where it left off across calls, instead of
restarting and re-exploring already-rejected territory.

```ts
// Before — coarse boolean flag
function step(value, hasSteppedOnce: boolean): Stream<V> { ... }

// After — typed context threaded through
function step(value, ctx: Ctx | undefined): Stream<[V, Ctx]> { ... }
```

---

## 18. Free wins: keep your dependencies fresh

Hot-path libraries (RNGs, parsers, hashers, codecs) routinely ship measurable
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
