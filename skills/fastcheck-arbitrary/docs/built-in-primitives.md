# Built-in Primitives

Arbitraries for generating primitive JavaScript values. Always check if a built-in covers your need before creating a custom one.

## Numbers

### `fc.integer(constraints?)`

Generate 32-bit signed integers.

**Constraints:** `min?` (default `-0x80000000`), `max?` (default `0x7fffffff`)

```ts
fc.integer();             // any 32-bit integer
fc.integer({ min: 0 });  // non-negative integers
fc.integer({ min: 1, max: 100 }); // integers in [1, 100]
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/integer.html).
Available since 0.0.1.

### `fc.nat(constraints?)`

Generate non-negative integers (natural numbers).

**Constraints:** `max?` (default `0x7fffffff`) — also accepts a plain number as shorthand

```ts
fc.nat();      // 0 to 0x7fffffff
fc.nat(99);    // 0 to 99
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/nat.html).
Available since 0.0.1.

### `fc.maxSafeInteger()`

Generate integers up to `Number.MAX_SAFE_INTEGER`.

Resources: [API reference](https://fast-check.dev/api-reference/functions/maxSafeInteger.html).
Available since 1.11.0.

### `fc.maxSafeNat()`

Generate non-negative integers up to `Number.MAX_SAFE_INTEGER`.

Resources: [API reference](https://fast-check.dev/api-reference/functions/maxSafeNat.html).
Available since 1.11.0.

### `fc.bigInt(constraints?)`

Generate arbitrary-precision integers (`bigint`).

**Constraints:** `min?`, `max?` — also accepts `(min, max)` positional arguments

```ts
fc.bigInt();
fc.bigInt({ min: 0n, max: 1000n });
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigInt.html).
Available since 1.9.0.

### `fc.float(constraints?)`

Generate 32-bit floating point numbers.

**Constraints:** `min?`, `max?`, `noDefaultInfinity?`, `noNaN?`, `noInteger?`, `minExcluded?`, `maxExcluded?`

```ts
fc.float();
fc.float({ min: 0, noNaN: true }); // non-negative, no NaN
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/float.html).
Available since 0.0.6 (constraints reworked in 2.6.0).

### `fc.double(constraints?)`

Generate 64-bit floating point numbers.

**Constraints:** `min?`, `max?`, `noDefaultInfinity?`, `noNaN?`, `noInteger?`, `minExcluded?`, `maxExcluded?`

```ts
fc.double();
fc.double({ min: 0, max: 1, noNaN: true }); // [0, 1] range, no NaN
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/double.html).
Available since 0.0.6 (constraints reworked in 2.6.0).

---

## Strings

### `fc.string(constraints?)`

Generate string values.

**Constraints:** `minLength?`, `maxLength?`, `size?`, `unit?`

The `unit` constraint controls what characters are used: `'grapheme'` (default), `'grapheme-ascii'`, `'grapheme-composite'`, `'binary'`, `'binary-ascii'`, or a custom `Arbitrary<string>` for individual units.

```ts
fc.string();
fc.string({ minLength: 1 });
fc.string({ unit: 'grapheme-ascii' }); // ASCII-only characters
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/string.html).
Available since 0.0.1.

### `fc.base64String(constraints?)`

Generate valid base64-encoded strings (always a multiple of 4 in length due to padding).

**Constraints:** `minLength?`, `maxLength?`, `size?`

Resources: [API reference](https://fast-check.dev/api-reference/functions/base64String.html).
Available since 0.0.1.

### `fc.stringMatching(regex, constraints?)`

Generate strings matching a given regular expression.

```ts
fc.stringMatching(/^[a-z]+@[a-z]+\.[a-z]{2,}$/);
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/stringMatching.html).
Available since 3.10.0.

### `fc.mixedCase(stringArb)`

Generate mixed-case versions of strings from another arbitrary.

```ts
fc.mixedCase(fc.constant('hello'));
// Examples: "hElLo", "HELLO", "Hello"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/mixedCase.html).
Available since 2.4.0.

---

## Boolean

### `fc.boolean()`

Generate `true` or `false`.

Resources: [API reference](https://fast-check.dev/api-reference/functions/boolean.html).
Available since 0.0.6.

---

## Date

### `fc.date(constraints?)`

Generate `Date` objects.

**Constraints:** `min?`, `max?`, `noInvalidDate?`

```ts
fc.date();
fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31'), noInvalidDate: true });
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/date.html).
Available since 1.17.0.

---

## Falsy

### `fc.falsy(constraints?)`

Generate falsy values: `false`, `null`, `undefined`, `0`, `''`, `Number.NaN`.

**Constraints:** `withBigInt?` — when `true`, also generates `0n`

Resources: [API reference](https://fast-check.dev/api-reference/functions/falsy.html).
Available since 1.26.0.
