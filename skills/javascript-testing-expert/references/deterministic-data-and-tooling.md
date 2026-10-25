# Deterministic data and runner setup

## Unused fields and clocks

- **👍 Prefer** `name: g(fc.string)` for an unused name, so a fixed literal does not imply significance. Pass the arbitrary factory, not `g(fc.string())`.
- **✅ Do** use an explicit multi-run property to claim a field never affects behavior. One `g` sample is insufficient.
- **✅ Do** control today's date with `g(fc.date, { noInvalidDate: true })` and `vi.setSystemTime(now)` when using fake timers. Restore `vi.useRealTimers()` in `finally`.
- **✅ Do** constrain dates to the supported domain. Generate related dates together so constraints such as `start <= end` survive shrinking.
- **❌ Don't** let the wall clock decide whether a test passes.
- **❌ Don't** narrow application types merely to avoid filling a test fixture.
- **✅ Do** control ambient locale, time, randomness, and external responses so replay restores the same conditions. Inject or stub these dependencies when production code uses them.

## Construct valid data directly

**👍 Prefer** arbitrary options and `map` to filtering when they express the domain:

```js
// Nonempty strings, without discarding empty samples.
fc.string({ minLength: 1 });

// Even nonnegative 32-bit integers, with a bound that prevents overflow.
fc.integer({ min: 0, max: 0x3fffffff }).map((value) => value * 2);

// Strings known to contain the marker, with shrinkable prefix and suffix.
fc.tuple(fc.string(), fc.string()).map(([prefix, suffix]) => prefix + 'A' + suffix);
```

Use [property patterns](properties-and-replay.md) to choose the invariant these generated values must satisfy.

## Keep Faker reproducible

- **👍 Prefer** built-in arbitraries for behavior-relevant fields, so failures shrink toward simpler values.
- **✅ Do** seed a fresh Faker instance from fast-check when Faker is already used. Avoid global Faker state.

A small reproducible adapter:

```ts
import { Faker, en } from '@faker-js/faker';
import * as fc from 'fast-check';

function fakerToArb<T>(generate: (faker: Faker) => T): fc.Arbitrary<T> {
  return fc.integer().map((seed) => {
    const faker = new Faker({ locale: en });
    faker.seed(seed);
    return generate(faker);
  });
}

const person = fakerToArb((faker) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
}));
```

- **⚠️ Limitation:** shrinking changes the seed; it does not semantically minimize names.
- **✅ Do** keep Faker version and locale fixed for replay. Control the reference date for relative-date generators.
- **✅ Do** call methods such as `firstName()`, rather than returning function objects.

## Runner integration and cleanup

These forms express the same property through the runner integration or direct fast-check calls:

```ts
// @fast-check/vitest
describe('encode', () => {
  it.prop([fc.string()], { numRuns: 100 })('should round-trip', (value) => {
    expect(decode(encode(value))).toBe(value);
  });
});

// fast-check inside the project's runner
describe('encode', () => {
  it('should round-trip', async () => {
    await fc.assert(
      fc.property(fc.string(), (value) => {
        expect(decode(encode(value))).toBe(value);
      }),
      { numRuns: 100 },
    );
  });
});
```

Import `it` from `@fast-check/vitest` for `it.prop`, or from the existing runner for direct `fc.assert`. Import `describe` and `expect` from the runner, and `fc` as a namespace from `fast-check`. Use [Version compatibility](version-compatibility.md) to adapt direct fast-check calls for older installations.

- **✅ Do** check Vitest's `clearMocks`, `mockReset`, `restoreMocks`, `unstubEnvs`, and `unstubGlobals` to determine which state needs explicit cleanup.
- **❌ Don't** assume runner cleanup happens between cases inside `fc.assert`. Reset state per evaluation; see [Execution hooks and limits](execution-and-limits.md).

- **✅ Do** choose tools for the boundary: Testing Library for component interactions, the project's browser runner for browser behavior, and MSW or equivalent for controlled network responses.
- **✅ Do** add needed devDependencies with the project's package manager. Explain which missing capability an optional runner integration or browser tool provides before adding it.
