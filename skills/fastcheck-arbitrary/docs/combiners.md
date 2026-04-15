# Combiners

Combine multiple arbitraries to build complex data structures.

## `fc.tuple(...arbitraries)`

Generate fixed-length tuples by aggregating values from each arbitrary.

```ts
fc.tuple(fc.nat(), fc.string());
// Examples: [17,"n"], [1187149108,"{}"], [302474255,"!!]"]…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/tuple.html).
Available since 0.0.1.

---

## `fc.record(model, constraints?)`

Generate objects matching a typed schema. Each key maps to an arbitrary for its value.

**Constraints:** `requiredKeys?`, `noNullPrototype?`

```ts
fc.record({
  id: fc.uuid({ version: 4 }),
  age: fc.nat(99),
});
// Examples: {"id":"0000001f-2a24-4215-b068-5798948c5f90","age":3}…

// Make some fields optional
fc.record(
  { id: fc.uuid({ version: 4 }), name: fc.string(), age: fc.nat(99) },
  { requiredKeys: ['id'] },
);
// name and age become optional, id is always present
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/record.html).
Available since 0.0.12.

---

## `fc.array(arb, constraints?)`

Generate arrays of variable length.

**Constraints:** `minLength?`, `maxLength?`, `size?`, `depthIdentifier?`

```ts
fc.array(fc.nat());
// Examples: [1811605556], [], [2039519833,1820186979,1716322482]…

fc.array(fc.nat(), { minLength: 3 });
// Always at least 3 elements
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/array.html).
Available since 0.0.1.

---

## `fc.uniqueArray(arb, constraints?)`

Generate arrays where all values are unique.

**Constraints:** `minLength?`, `maxLength?`, `selector?`, `comparator?`, `size?`, `depthIdentifier?`

- `comparator` — `SameValue` (default, `Object.is`), `SameValueZero` (like `Set`/`Map`), `IsStrictlyEqual` (`===`), or a custom function
- `selector` — project values before comparing (recommended over custom `comparator` for performance)

```ts
fc.uniqueArray(fc.nat(99));
// Examples: [51,68,39,84,4], []…

// Unique by id field
fc.uniqueArray(
  fc.record({ id: fc.nat(), name: fc.constantFrom('Anna', 'Paul') }),
  { selector: (entry) => entry.id },
);
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/uniqueArray.html).
Available since 2.23.0.

---

## `fc.set(arb, constraints?)`

Generate `Set` objects with unique values. Uses SameValueZero comparison (same as native `Set`).

**Constraints:** `minLength?`, `maxLength?`, `size?`, `depthIdentifier?`

```ts
fc.set(fc.nat());
// Examples: new Set([1681938411,278250656,2138206756])…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/set.html).
Available since 4.4.0.

---

## `fc.map(keyArb, valueArb, constraints?)`

Generate `Map` objects with unique keys.

**Constraints:** `minKeys?`, `maxKeys?`, `size?`, `depthIdentifier?`

```ts
fc.map(fc.string(), fc.nat());
// Examples: new Map([["k",1448733623],["#_",2147483645]])…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/map.html).
Available since 4.4.0.

---

## `fc.dictionary(keyArb, valueArb, constraints?)`

Generate plain JavaScript objects as key-value stores.

**Constraints:** `minKeys?`, `maxKeys?`, `size?`, `noNullPrototype?`, `depthIdentifier?`

```ts
fc.dictionary(fc.string(), fc.nat());
// Examples: {"":11,".[hM+$+:?N":30,"%{":59342696}…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/dictionary.html).
Available since 1.0.0.

---

## `fc.oneof(...arbitraries)`

Randomly select one of the provided arbitraries. Supports weighted selection.

**Constraints (first argument, optional):** `withCrossShrink?`, `maxDepth?`, `depthSize?`, `depthIdentifier?`

> The first arbitrary has a privileged position: `withCrossShrink` and `depthSize` favor it over others.

```ts
fc.oneof(fc.string(), fc.boolean());
// Examples: false, "x ", true…

// Weighted selection
fc.oneof({ arbitrary: fc.string(), weight: 5 }, { arbitrary: fc.boolean(), weight: 2 });
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/oneof.html).
Available since 0.0.1.

---

## `fc.option(arb, constraints?)`

Generate either a value from the underlying arbitrary or a nil value.

**Constraints:** `freq?` (default `5`, probability of nil is 1/freq), `nil?` (default `null`), `depthSize?`, `maxDepth?`, `depthIdentifier?`

```ts
fc.option(fc.nat());
// Examples: 28, null, 2001121804…

fc.option(fc.string(), { nil: undefined });
// nil is undefined instead of null
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/option.html).
Available since 0.0.6.

---

## `fc.constant(value)` / `fc.constantFrom(...values)`

Generate fixed constant values.

- `fc.constant(value)` — always produce the same value
- `fc.constantFrom(...values)` — pick one of the provided values (equiprobable, shrinks toward the first)

```ts
fc.constant('hello');
// Always: "hello"

fc.constantFrom('red', 'green', 'blue');
// Examples: "red", "blue", "green"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/constant.html), [constantFrom](https://fast-check.dev/api-reference/functions/constantFrom.html).
Available since 0.0.1.

---

## `fc.mapToConstant(...entries)`

Map generated indices to constant values based on frequency weights. Useful for building character-level arbitraries or similar mappings.

```ts
fc.mapToConstant(
  { num: 26, build: (v) => String.fromCharCode(v + 0x61) }, // a-z
  { num: 10, build: (v) => String.fromCharCode(v + 0x30) }, // 0-9
);
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/mapToConstant.html).
Available since 1.14.0.

---

## `fc.letrec(builder)` / `fc.memo(builder)`

Generate recursive data structures.

**Prefer `fc.letrec`** over `fc.memo` — it covers most use cases and offers better depth control.

```ts
// Recursive tree with automatic depth control
const { tree } = fc.letrec((tie) => ({
  tree: fc.oneof({ depthSize: 'small', withCrossShrink: true }, tie('leaf'), tie('node')),
  node: fc.record({ left: tie('tree'), right: tie('tree') }),
  leaf: fc.nat(),
}));

// With explicit max depth using fc.option
fc.letrec((tie) => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), { maxDepth: 1, depthIdentifier: 'tree' }),
    right: fc.option(tie('node'), { maxDepth: 1, depthIdentifier: 'tree' }),
  }),
})).node;
```

> Use `depthIdentifier` to share depth tracking between sibling branches (e.g. left and right).

Resources: [letrec](https://fast-check.dev/api-reference/functions/letrec.html), [memo](https://fast-check.dev/api-reference/functions/memo.html).
Available since 1.16.0.
