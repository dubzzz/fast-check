# Advanced Built-ins

Specialized arbitraries for domain-specific values, collections, typed arrays, functions, and modifiers.

## Internet

### `fc.webUrl(constraints?)`

Generate valid web URLs following RFC 3986 and WHATWG URL Standard.

**Constraints:** `authoritySettings?`, `validSchemes?` (default `['http', 'https']`), `withFragments?`, `withQueryParameters?`, `size?`

```ts
fc.webUrl();
// Examples: "https://1e.pl/", "http://ay84wia.bi/%05/_"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/webUrl.html). Available since 1.14.0.

### `fc.webAuthority(constraints?)`

Generate URL authority portions (hostname with optional port, IP, user info).

**Constraints:** `withIPv4?`, `withIPv4Extended?`, `withIPv6?`, `withPort?`, `withUserInfo?`, `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/webAuthority.html). Available since 1.14.0.

### `fc.webPath(constraints?)`

Generate URL path segments following RFC 3986 and WHATWG URL Standard.

**Constraints:** `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/webPath.html). Available since 3.3.0.

### `fc.webSegment(constraints?)`

Generate a single URL path segment (percent-encoded safe).

**Constraints:** `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/webSegment.html). Available since 1.14.0.

### `fc.webQueryParameters(constraints?)`

Generate URL query parameter strings (the part after `?`).

**Constraints:** `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/webQueryParameters.html). Available since 1.14.0.

### `fc.webFragments(constraints?)`

Generate URL fragment identifiers (the part after `#`).

**Constraints:** `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/webFragments.html). Available since 1.14.0.

### `fc.domain(constraints?)`

Generate valid domain names following RFC 1034, RFC 1123, and WHATWG URL Standard.

**Constraints:** `size?`

```ts
fc.domain();
// Examples: "6i1.ws", "p.s.snp", "gkamh0qv6l.krzi6l5r.nwr"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/domain.html). Available since 1.14.0.

### `fc.emailAddress(constraints?)`

Generate valid email addresses following RFC 1123 and RFC 5322.

**Constraints:** `size?`

```ts
fc.emailAddress();
// Examples: "4@fgqcru.ca", "fo/2p~zq.kn'e&bfa|1`@9fqau6rah8.ox"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/emailAddress.html). Available since 1.14.0.

### `fc.ipV4()`

Generate valid IPv4 addresses (RFC 3986).

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV4.html). Available since 1.14.0.

### `fc.ipV4Extended()`

Generate valid IPv4 addresses including extended formats supported by WHATWG standard.

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV4Extended.html). Available since 1.17.0.

### `fc.ipV6()`

Generate valid IPv6 addresses with various formats and compression.

Resources: [API reference](https://fast-check.dev/api-reference/functions/ipV6.html). Available since 1.14.0.

---

## Identifiers

### `fc.uuid(constraints?)`

Generate valid UUIDs.

**Constraints:** `version?` — default `[1,2,3,4,5,6,7,8]`, supports versions 1-15

```ts
fc.uuid();
fc.uuid({ version: 4 });
fc.uuid({ version: [4, 7] });
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uuid.html). Available since 1.17.0.

### `fc.ulid()`

Generate ULIDs (Universally Unique Lexicographically Sortable Identifiers).

Resources: [API reference](https://fast-check.dev/api-reference/functions/ulid.html). Available since 3.11.0.

---

## Data / JSON

### `fc.json(constraints?)`

Generate valid JSON strings.

**Constraints:** `depthSize?`, `maxDepth?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/json.html). Available since 0.0.7.

### `fc.jsonValue(constraints?)`

Generate JSON-compatible values (not stringified).

**Constraints:** `depthSize?`, `maxDepth?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/jsonValue.html). Available since 2.20.0.

### `fc.anything(constraints?)`

Generate any JavaScript value with full depth/structure control.

**Constraints:** `key?`, `maxDepth?`, `maxKeys?`, `depthSize?`, `withBigInt?`, `withDate?`, `withMap?`, `withSet?`, `withTypedArray?`, `withNullPrototype?`, `values?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/anything.html). Available since 0.0.7.

### `fc.object(constraints?)`

Generate arbitrary objects with any shape and contents.

**Constraints:** same as `fc.anything`

Resources: [API reference](https://fast-check.dev/api-reference/functions/object.html). Available since 0.0.7.

### `fc.lorem(constraints?)`

Generate Lorem Ipsum text.

**Constraints:** `mode?` (`'words'` or `'sentences'`), `maxCount?`, `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/lorem.html). Available since 0.0.1.

---

## Collections

### `fc.subarray(originalArray, constraints?)`

Generate subarrays maintaining order from the original array.

**Constraints:** `minLength?`, `maxLength?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/subarray.html). Available since 1.5.0.

### `fc.shuffledSubarray(originalArray, constraints?)`

Generate shuffled subarrays from the original array.

**Constraints:** `minLength?`, `maxLength?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/shuffledSubarray.html). Available since 1.5.0.

### `fc.sparseArray(arb, constraints?)`

Generate arrays with holes (sparse entries).

**Constraints:** `minNumElements?`, `maxNumElements?`, `maxLength?`, `size?`, `noTrailingHole?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/sparseArray.html). Available since 2.13.0.

### `fc.infiniteStream(arb, constraints?)`

Generate infinite streams of values.

**Constraints:** `enableHistory?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/infiniteStream.html). Available since 0.0.1.

---

## Typed Arrays

All typed array arbitraries accept constraints for `min`, `max` (element value bounds), `minLength`, `maxLength`, and `size`.

| Arbitrary | Type |
|---|---|
| `fc.int8Array()` | `Int8Array` |
| `fc.uint8Array()` | `Uint8Array` |
| `fc.uint8ClampedArray()` | `Uint8ClampedArray` |
| `fc.int16Array()` | `Int16Array` |
| `fc.uint16Array()` | `Uint16Array` |
| `fc.int32Array()` | `Int32Array` |
| `fc.uint32Array()` | `Uint32Array` |
| `fc.float32Array()` | `Float32Array` |
| `fc.float64Array()` | `Float64Array` |
| `fc.bigInt64Array()` | `BigInt64Array` |
| `fc.bigUint64Array()` | `BigUint64Array` |

Resources: [API reference](https://fast-check.dev/api-reference/functions/int8Array.html). Available since 2.9.0.

---

## Functions

### `fc.func(arb)`

Generate deterministic pure functions with recorded outputs and pretty-printing.

```ts
fc.func(fc.nat());
// Generates: (...args) => nat()  (deterministic based on input hash)
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/func.html). Available since 1.6.0.

### `fc.compareFunc()`

Generate comparison functions suitable for `Array.prototype.sort`.

Resources: [API reference](https://fast-check.dev/api-reference/functions/compareFunc.html). Available since 1.6.0.

### `fc.compareBooleanFunc()`

Generate boolean comparison functions.

Resources: [API reference](https://fast-check.dev/api-reference/functions/compareBooleanFunc.html). Available since 1.6.0.

---

## Testing Tools

### `fc.context()`

Generate a `ContextValue` for logging within a test run. Logs are attached to the counterexample on failure.

Resources: [API reference](https://fast-check.dev/api-reference/functions/context.html). Available since 1.8.0.

### `fc.gen()`

Generate values inline during test execution. Simplifies property-based tests by allowing on-the-fly generation.

> Calls to `g(arbFactory, ...args)` must use a stable function reference as the first argument.

Resources: [API reference](https://fast-check.dev/api-reference/functions/gen.html). Available since 3.8.0.

### `fc.scheduler(constraints?)`

Generate task schedulers for testing async code ordering.

**Constraints:** `act?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/scheduler.html). Available since 1.20.0.

### `fc.commands(commandArbs, constraints?)`

Generate sequences of commands for model-based testing.

**Constraints:** `disableReplayLog?`, `maxCommands?`, `size?`, `replayPath?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/commands.html). Available since 1.5.0.

---

## Modifiers

### `fc.noShrink(arb)`

Disable shrinking for an arbitrary.

> Prefer using `endOnFailure` or `interruptAfterTimeLimit` over disabling shrinking entirely.

Resources: [API reference](https://fast-check.dev/api-reference/functions/noShrink.html). Available since 3.20.0.

### `fc.noBias(arb)`

Remove bias from an arbitrary, producing a closer-to-uniform distribution.

Resources: [API reference](https://fast-check.dev/api-reference/functions/noBias.html). Available since 3.20.0.

### `fc.limitShrink(arb, maxShrinks)`

Cap the number of shrink attempts for an arbitrary.

Resources: [API reference](https://fast-check.dev/api-reference/functions/limitShrink.html). Available since 3.20.0.

### `fc.clone(arb, numValues)`

Generate multiple identical independent copies of a value.

```ts
fc.clone(fc.nat(), 2);
// Examples: [1395148595,1395148595]…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/clone.html). Available since 2.5.0.
