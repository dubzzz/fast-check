# Extending Arbitrary (Last Resort)

> **This should be your last resort.** Most needs are covered by `.map`, `.filter`, `.chain`, and combiners. Only extend `Arbitrary` directly when you need to wrap an external RNG-based library or implement generation logic that cannot be expressed with existing tools.

## When extending is justified

- Wrapping an external fake data library (e.g. `@faker-js/faker`, `lorem-ipsum`) that has its own RNG
- Implementing a generator that needs direct access to the random number generator for performance
- Building an arbitrary with custom shrinking behavior that cannot be achieved through composition

## The three methods to implement

Extend `fc.Arbitrary<T>` and implement these three abstract methods:

```ts
import fc from 'fast-check';

class MyArbitrary extends fc.Arbitrary<MyType> {
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<MyType> {
    // Produce a random value using mrng
    // biasFactor: if defined, 1 value over biasFactor should be "biased" (edge case)
    // Return: new fc.Value(generatedValue, context)
    //   context is stored and passed back to shrink() later
  }

  canShrinkWithoutContext(value: unknown): value is MyType {
    // Type guard: can this value be shrunk without context from generate()?
    // Called when fast-check needs to shrink a user-provided value
    // Return false if shrinking without context is not supported
  }

  shrink(value: MyType, context: unknown | undefined): fc.Stream<fc.Value<MyType>> {
    // Return a stream of simpler values for shrinking
    // context comes from generate() or a previous shrink()
    // Return fc.Stream.nil() if no shrinking is possible
  }
}
```

## Key types

- **`fc.Value<T>`** — wraps a generated value with its shrinking context. Constructor: `new fc.Value(value, context)`
- **`fc.Stream<T>`** — lazy iterable for shrink trees. Key methods: `fc.Stream.nil()` (empty), `fc.Stream.of(value)` (single element)
- **`fc.Random`** — random number generator. Key methods: `mrng.nextInt(min, max)`, `mrng.nextDouble()`, `mrng.clone()`

## Example: Wrapping @faker-js/faker

This is the recommended pattern for integrating Faker with fast-check (since Faker 8.2.0):

```ts
import { Faker, Randomizer, base } from '@faker-js/faker';
import fc from 'fast-check';

class FakerBuilder<TValue> extends fc.Arbitrary<TValue> {
  constructor(private readonly generator: (faker: Faker) => TValue) {
    super();
  }

  generate(mrng: fc.Random, _biasFactor: number | undefined): fc.Value<TValue> {
    const randomizer: Randomizer = {
      next: (): number => mrng.nextDouble(),
      seed: () => {}, // no-op, fast-check controls the seed
    };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(this.generator(customFaker), undefined);
  }

  canShrinkWithoutContext(_value: unknown): _value is TValue {
    return false; // no shrinking support
  }

  shrink(_value: TValue, _context: unknown): fc.Stream<fc.Value<TValue>> {
    return fc.Stream.nil(); // no shrinking support
  }
}

function fakerToArb<TValue>(generator: (faker: Faker) => TValue): fc.Arbitrary<TValue> {
  return new FakerBuilder(generator);
}

// Usage
const firstNameArb = fakerToArb((faker) => faker.person.firstName());
const addressArb = fakerToArb((faker) => faker.location.streetAddress());
```

## Example: Wrapping a random-based library (lorem-ipsum)

For libraries that accept a custom `Math.random`-like function:

```ts
import fc from 'fast-check';
import { loremIpsum } from 'lorem-ipsum';

const loremArb = fc
  .noShrink(
    fc.infiniteStream(
      fc.noBias(fc.integer({ min: 0, max: (1 << 24) - 1 }).map((v) => v / (1 << 24))),
    ),
  )
  .map((s) => {
    const rng = () => s.next().value; // prng like Math.random but controlled by fast-check
    return loremIpsum({ random: rng });
  });
```

> Note: This pattern uses `.map` on an infinite stream rather than extending `Arbitrary` directly — a simpler alternative when the library accepts a pluggable RNG.

## Seed-based wrapping (simpler alternative)

If the external library supports seeding but not a custom RNG, you can use `.map` on a seed:

```ts
import fc from 'fast-check';
import { faker } from '@faker-js/faker';

const fakerToArb = (fakerGen: () => unknown) => {
  return fc
    .noShrink(fc.noBias(fc.integer()))
    .map((seed) => {
      faker.seed(seed);
      return fakerGen();
    });
};

const streetAddressArb = fakerToArb(() => faker.location.streetAddress());
```

> **Limitations:** Arbitraries created by extending `Arbitrary` without implementing `shrink` will not be able to shrink generated values. This means failures may be reported with larger counterexamples than necessary.
