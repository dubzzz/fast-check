# Deterministic data and runner setup

## Unused fields and clocks

- **👍 Prefer** `name: g(fc.string)` for an incidental name. Pass the arbitrary factory, not `g(fc.string())`.
- **✅ Do** use an explicit multi-run property to claim a field never affects behavior. One `g` sample is insufficient.
- **✅ Do** control today's date with `g(fc.date, { noInvalidDate: true })` and `vi.setSystemTime(now)` when using fake timers. Restore `vi.useRealTimers()` in `finally`.
- **✅ Do** constrain dates to the supported domain. Generate related dates together for temporal properties.
- **❌ Don't** let the wall clock decide whether a test passes.
- **❌ Don't** narrow application types merely to avoid filling a test fixture.

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

**✅ Do** use defaults when they match the supported domain. Prefer `size: '-1'` for cheaper exploration before hard length caps. A documented browser journey budget is different from a domain constraint; an arbitrary cap must never remove a known failing case. The [property patterns](properties-and-replay.md) cover independent invariants, input-derived relations, constructed inputs, function compositions, and simpler references.

## Keep Faker reproducible

- **👍 Prefer** built-in arbitraries for behavior-relevant fields.
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

## Runner integration and mocks

**✅ Do** use the existing runner and compatible integration. These forms express the same property in v5:

```ts
// @fast-check/vitest
it.prop([fc.string()], { numRuns: 100 })('should round-trip', (value) => {
  expect(decode(encode(value))).toBe(value);
});

// fast-check inside the project's runner
it('should round-trip', async () => {
  await fc.assert(
    fc.property(fc.string(), (value) => {
      expect(decode(encode(value))).toBe(value);
    }),
    { numRuns: 100 },
  );
});
```

Use the imports appropriate to each form. For direct fast-check on older versions, follow [Version compatibility](version-compatibility.md).

- **✅ Do** inspect Vitest's `clearMocks`, `mockReset`, `restoreMocks`, `unstubEnvs`, and `unstubGlobals`.
- **❌ Don't** assume runner cleanup happens between cases inside `fc.assert`. Reset state per evaluation; see [Execution hooks and limits](execution-and-limits.md).

- **👎 Avoid** extensive mocks and assertions that restate internal call order. Review the test boundary when setup grows.
- **✅ Do** test consequential public component interactions.
- **❌ Don't** duplicate dependency tests or test trivial private component logic.

## Cover contract variants

- **👍 Prefer** a shared contract suite for interchangeable implementations or configurations, with each variant named. Keep differing behavior in explicit tests.
- **✅ Do** cover synchronous return/throw and asynchronous resolve/reject when the API supports them. Check synchronous behavior before awaiting; `await` alone hides whether a value was returned directly or through a promise.

## File and code layout

- **✅** Mimic the existing file layout, naming, assertion style, and runner. Without an established convention, prefer colocated `.spec.ts` files, `describe` named after the function or public component under test, and `it('should ...')` names that state the contract.
- **✅** Put simple documenting examples before more exploratory properties. Keep each test focused on one behavior; several assertions may describe that behavior.
- **✅** Make Arrange, Act, and Assert easy to identify. Put shared helpers below the tests under `// Helpers`, with names describing their purpose. Avoid a large configurable `prepare` helper that hides the action being tested.
- **👍** Prefer `@fast-check/vitest` if already installed. Otherwise use `fast-check` directly inside the existing runner. Add relevant devDependencies using the project's package manager when needed; explain why an optional runner integration or browser tool would help before adding it.
- **✅** Use Testing Library for component behavior, the project's browser runner for real browser behavior, and controlled network dependencies such as MSW for isolated tests. A true integration or E2E test may intentionally exercise a real test service; isolate its data and do not depend on uncontrolled external services.
