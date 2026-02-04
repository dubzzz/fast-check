# Equivalence `fast-check` and `@fast-check/vitest`

> **⚠️ Scope:** How to translate between `fast-check` and `@fast-check/vitest` syntax?

## Using `g` for inline generation

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it('...', ({ g }) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import fc from 'fast-check';
it('...', () => {
  fc.assert(
    fc.property(fc.gen(), (g) => {
      //...
    }),
  );
});
```

## Using `it.prop` for property-based tests

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it.prop([...arbitraries])('...', (...values) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import fc from 'fast-check';
it('...', () => {
  fc.assert(
    fc.property(...arbitraries, (...values) => {
      //...
    }),
  );
});
```

## Async properties

If the predicate of `it` or `it.prop` is asynchronous, when using only `fast-check` the property has to be instantiated via `asyncProperty` and `assert` has to be awaited.

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it.prop([...arbitraries])('...', async (...values) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import fc from 'fast-check';
it('...', async () => {
  await fc.assert(
    fc.asyncProperty(...arbitraries, async (...values) => {
      //...
    }),
  );
});
```
