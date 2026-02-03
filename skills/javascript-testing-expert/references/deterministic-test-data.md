# Deterministic test data

> **⚠️ Scope:** How to keep tests reproducible and deterministic when dealing with random data, fake data generators or platform-dependent values like dates?

## General principle

**✅ Do** wire random data generation through `fast-check`

```ts
// ❌ Problematic: the inputs passed to the function under tests are changing from one execution to another without any way to know which one got used, and to re-run with the same ones
it('should compute the right initials', () => {
  // Arrange
  const user: User = {
    fullName: 'Paul Smith',
    age: Math.ceil(Math.random() * 77), // not even used
  };

  // Act
  const initials = computeInitials(user);

  // Assert
  expect(initials).toBe('PS');
});
```

## Connecting `@faker-js/faker` in `fast-check`...

If using `@faker-js/faker` to fake data, we recommend wiring any fake data generation within `fast-check` by leveraging this code snippet:

```ts
// Source: https://fast-check.dev/blog/2024/07/18/integrating-faker-with-fast-check/
import { Faker, Randomizer, base } from '@faker-js/faker';
import fc from 'fast-check';

class FakerBuilder<TValue> extends fc.Arbitrary<TValue> {
  constructor(private readonly generator: (faker: Faker) => TValue) {
    super();
  }
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<TValue> {
    const randomizer: Randomizer = {
      next: (): number => mrng.nextDouble(),
      seed: () => {}, // no-op, no support for updates of the seed, could even throw
    };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(this.generator(customFaker), undefined);
  }
  canShrinkWithoutContext(value: unknown): value is TValue {
    return false;
  }
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<TValue>> {
    return fc.Stream.nil();
  }
}

function fakerToArb<TValue>(generator: (faker: Faker) => TValue): fc.Arbitrary<TValue> {
  return new FakerBuilder(generator);
}
```

Example of usage

```ts
fc.assert(
  fc.property(
    fakerToArb((faker) => faker.person.firstName),
    fakerToArb((faker) => faker.person.lastName),
    (firstName, lastName) => {
      // code
    },
  ),
);
```
