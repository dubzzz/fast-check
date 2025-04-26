---
title: Integrating Faker with fast-check
authors: [dubzzz]
tags: [tips, integration]
image: '@site/static/img/blog/2024-07-18-integrating-faker-with-fast-check--social.png'
---

[Faker](https://fakerjs.dev) is a well-known and powerful library for generating fake data. It provides a wide range of random but realistic-looking data generators. However, testing with purely random data can be risky, which is why property-based testing is valuable. While using fake but realistic data in tests can be beneficial, it is essential to integrate it properly. fast-check offers a robust solution for this integration.

<!--truncate-->

## Random data in tests

### Risks

Failures caused by tests involving random data can be challenging to reproduce. This unpredictability can lead to failures in CI that are hard to replicate locally. This difficulty in replaying failures and identifying problematic inputs is a significant reason why random data is often avoided in tests.

### Value

Despite the risks, random data can be incredibly valuable in tests. Property-based testing tools like fast-check make random data reliable in tests. The core idea is that random data can uncover unexpected issues that may affect users. By making random data a core component, property-based testing helps developers focus on the functionality of their code, rather than just edge cases. It achieves this by providing an extra layer of safety, making the use of random data risk-free.

### Faker

Faker can be used in tests, as suggested in its documentation. However, without proper integration, it can be unreliable when failures occur. A common workaround is to use a fixed seed for both CI and local runs. This approach limits the effectiveness of Faker, as it only generates the same hardcoded values instead of producing new ones for each run. In essence, the fixed seed trick reduces a random data generator library to producing the same value every time.

To address these issues, this post aims to integrate Faker with fast-check. By leveraging fast-check's replay and reporting capabilities, we can make testing safer and more reliable. With fast-check backing Faker, you'll benefit from a one-liner replay capability and immediate identification of the problematic input, eliminating the need for local runs or custom logging and reporting.

## Naive integration

For some time, our documentation recommended the following basic integration approach:

```ts
import { faker } from '@faker-js/faker';
import fc from 'fast-check';

function fakerToArb<TValue>(generator: () => TValue): fc.Arbitrary<TValue> {
  return fc.noShrink(fc.integer()).map((seed) => {
    faker.seed(seed);
    return generator();
  });
}
```

### How it works

This code generates a seed, seeds Faker with it, and then generates a value using the provided generator. Users can use it as follows:

```ts
test('produce a string containing the first and the last name', () => {
  fc.assert(
    fc.property(fakerToArb(faker.person.firstName), fakerToArb(faker.person.lastName), (firstName, lastName) => {
      const formatted = format(firstName, lastName);
      expect(formatted).toContain(firstName);
      expect(formatted).toContain(lastName);
    }),
  );
});
```

:::info Shrink or no shrink?

As shrinking the seed does not provide any value in terms of the shrinker, we wrapped our seed generator within `fc.noShrink(...)`. Shrinking only makes sense if it simplifies the produced values. By shrinking the seed, we have no guarantee that we will reach a simpler value. As such, we dropped the shrinking capabilities for `fakerToArb`.
:::

### Limitations

While this approach works, it has several limitations:

- Performance: Instantiating and seeding generators repeatedly is not efficient.
- Distribution: Values generated this way are not well-distributed and are more likely to collide.
- Side Effects: Seeding Faker globally is a side effect. It can make our tests less reliable.

## Recommended integration

To address these issues, we need to:

- Use a scoped instance of Faker to avoid global side effects.
- Reuse the random generator passed by fast-check to ensure efficient and well-distributed value generation.

### Updated API

We can change the API to request users to use a dedicated instance of Faker:

```ts
function fakerToArb<TValue>(generator: (faker: Faker) => TValue): fc.Arbitrary<TValue> {
  throw new Error('Not implemented yet');
}
```

### Upadted usage

The updated usage would be:

```ts
test('produce a string containing the first and the last name', () => {
  fc.assert(
    fc.property(
      fakerToArb((faker) => faker.person.firstName),
      fakerToArb((faker) => faker.person.lastName),
      (firstName, lastName) => {
        const formatted = format(firstName, lastName);
        expect(formatted).toContain(firstName);
        expect(formatted).toContain(lastName);
      },
    ),
  );
});
```

### Implementation

Our constraint of reusing the generator passed by fast-check prevents us from relying on `map`, `filter` or `chain`, as none of these methods forward the generator. The only option is to implement `fc.Arbitrary<TValue>` and connect Faker with the received generator instance passed by fast-check when calling `generate`.

Here is the implmentation we came up with:

```ts
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

This refined implementation addresses most of the issues with the naive approach and provides a more powerful and cleaner integration with Faker.

## Advanced integration

The previous implementation does not provide any shrinking capabilities. While beneficial for maintaining realistic values, shrinking may be desired in specific scenarios. For instance, you might be seeking realistic first names but are actually fine with any string that contains at least one printable character.

### Simplified version

To incorporate shrinking capabilities, let's simplify the previous snippet to focus on generating first names only:

```ts
class FakerFirstNameBuilder extends fc.Arbitrary<string> {
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<string> {
    const randomizer = { next: () => mrng.nextDouble(), seed: () => {} };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(customFaker.person.firstName(), undefined);
  }
  canShrinkWithoutContext(value: unknown): value is string {
    return false;
  }
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<string>> {
    return fc.Stream.nil();
  }
}
```

### Adding shrinking

Shrinking capabilities primarily depend on the `shrink` method of `FakerFirstNameBuilder`.

:::info What about others?

It's important to note that attributing shrinker capability solely to the `shrink` method is a simplification. All methods within an Arbitrary instance work together to provide effective shrinking.

In practice, the `generate` method often augments generated values with additional contextual information. This contextual data is included as the second argument in `new Value(value, context)` and forwarded to `shrink` at shrink time.

Conversely, `canShrinkWithoutContext` plays a crucial role in expanding shrinking capabilities to values not directly generated by the current instance of `Arbitrary`. When invoked with a value, it determines whether it's appropriate to invoke `shrink` without providing a specific context.
:::

For first name, shrinking should ideally leverage the same mechanisms as those used by `fc.string()`. A basic integration could look like this:

```ts
const strArb = fc.string({ minLength: 1 });

class FakerFirstNameBuilder extends fc.Arbitrary<string> {
  // generate() {...}
  // canShrinkWithoutContext() {...}
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<string>> {
    return strArb.shrink(value, context);
  }
}
```

However, this approach assumes that any value generated by `<faker>.person.firstName()` is shrinkable by `strArb`. This assumption may not always hold. As such we have to make sure `strArb` can shrink values not coming from it before calling it on `shrink`.

```ts
const strArb = fc.string({ minLength: 1 });

class FakerFirstNameBuilder extends fc.Arbitrary<string> {
  // generate() {...}
  // canShrinkWithoutContext() {...}
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<string>> {
    if (context !== undefined || strArb.canShrinkWithoutContext(value)) {
      return strArb.shrink(value, context);
    }
    return fc.Stream.nil();
  }
}
```

But, our implementation still makes a subtle assumption. It supposes that an undefined context value is always linked to a value coming from our own `generate` and cannot be something produced by the shrinker of `strArb`. We can make it safer by being able to differentiate our own values from the ones of `strArb`.

```ts
const ctxProbe = Symbol();
const strArb = fc.string({ minLength: 1 });

class FakerFirstNameBuilder extends fc.Arbitrary<string> {
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<string> {
    const randomizer = { next: () => mrng.nextDouble(), seed: () => {} };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(customFaker.person.firstName(), ctxProbe);
  }
  canShrinkWithoutContext(value: unknown): value is string {
    return false;
  }
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<string>> {
    if (context !== ctxProbe || strArb.canShrinkWithoutContext(value)) {
      return strArb.shrink(value, context);
    }
    return fc.Stream.nil();
  }
}
```

:::tip `fc.string()` might not be ideal

While the previous implementation is functional, users might have requirements to exclude certain characters from generated strings. Therefore, `fc.string()` might not be optimal since it could potentially shrink a first name to include non-alphabetic characters. An alternative approach could involve using `fc.stringOf(...)` to better control the character set allowed in generated strings.
:::

## Conclusion

Faker and fast-check complement each other to significantly enhance testing capabilities.

fast-check offers stability, error replay capabilities, and improved failure reporting, which are essential for robust testing scenarios. Meanwhile, Faker's extensive range of data generators allows users to create realistic test data.

Currently, fast-check does not natively integrate with Faker. I would like to express my gratitude to the Faker team for their recent addition of the custom `Randomizer` feature (since v8.2.0 and [#2284](https://github.com/faker-js/faker/pull/2284)). This enhancement has enabled a seamless and powerful integration that enhances testing workflows significantly.
