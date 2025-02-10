---
slug: /advanced/fake-data/
---

# Fake data

Replace random fake data by fake data backed by property based

## From tests with random to properties

Before diving into how to integrate your favorite fake data libraries with fast-check, let's explore one of the main reasons why users may prefer using these libraries in an uncontrolled way within their tests, rather than relying on property-based testing techniques for generating random inputs in a deterministic and reproducible manner.

Moving from simple random tests to property-based testing can greatly improve the effectiveness of your testing. While random tests are easy to write, they are not always reproducible and do not allow for shrinking in case of failure.

The following snippet is an example of such tests:

```js
test('sort users by ascending age', () => {
  const userA = {
    firstName: firstName(),
    lastName: lastName(),
    birthDate: birthDate(),
  };
  const userB = {
    firstName: firstName(),
    lastName: lastName(),
    birthDate: birthDate({ strictlyOlderThan: userA.birthDate }),
  };
  expect(sortByAge([userA, userB])).toEqual([userA, userB]);
  expect(sortByAge([userB, userA])).toEqual([userA, userB]);
});
```

Although the previous test successfully generates random users and checks that ordering is applied correctly, it falls short when it comes to providing details about the nature of any failures that may occur. In contrast, property-based testing, while requiring more initial effort, provides more reliable tests that can report failures and simplify the debugging process. To demonstrate this, we can rewrite the previous test using a property-based approach as shown below:

```js
test('sort users by ascending age', () => {
  fc.assert(
    fc.property(
      fc
        .record({
          firstName: firstNameArb(),
          lastName: lastNameArb(),
          birthDate: birthDateArb(),
        })
        .chain((userA) =>
          fc.record({
            userA: fc.constant(userA),
            userB: fc.record({
              firstName: firstNameArb(),
              lastName: lastNameArb(),
              birthDate: birthDateArb({ strictlyOlderThan: userA.birthDate }),
            }),
          }),
        ),
      ({ userA, userB }) => {
        expect(sortByAge([userA, userB])).toEqual([userA, userB]);
        expect(sortByAge([userB, userA])).toEqual([userA, userB]);
      },
    ),
  );
});
```

The previous test revealed a challenge in generating entries beforehand, which can be a significant obstacle to adopting property-based testing.

This challenge has been addressed with the introduction of `gen` in fast-check. It makes writing property-based tests as straightforward as writing regular tests. With `gen` the test can be written as follow:

```js
test('sort users by ascending age', () => {
  fc.assert(
    fc.property(fc.gen(), (g) => {
      const userA = {
        firstName: g(firstName),
        lastName: g(lastName),
        birthDate: g(birthDate),
      };
      const userB = {
        firstName: g(firstName),
        lastName: g(lastName),
        birthDate: g(birthDate, { strictlyOlderThan: userA.birthDate }),
      };
      expect(sortByAge([userA, userB])).toEqual([userA, userB]);
      expect(sortByAge([userB, userA])).toEqual([userA, userB]);
    }),
  );
});
```

## Native ones

Although fast-check is not primarily designed for generating fake data, it does come with a number of [built-in generators](/docs/core-blocks/arbitraries/combiners/) doing so. Each built-in generator is designed to produce any acceptable value for the requested data, taking into account any subtleties in the specification.

For example, while an IPv4 address may be commonly represented as something like `127.0.0.1`, the specification allows for other formats such as `0x4.034`, and fast-check's IPv4 generator is able to generate values accordingly.

However, fast-check does not currently provide generators for names, surnames, or other non-fully constrained values. It is up to the user to provide their own generators for such data types.

:::tip Build your own arbitraries
If you need to generate custom fake data, such as names and surnames, you can refer to fast-check's [combiners](/docs/core-blocks/arbitraries/combiners/), which are designed to allow users to create their own values according to their specific needs.
:::

## Fake data libraries

In order to integrate external fake data libraries with fast-check, the generators have to be wrapped as arbitraries.

:::warning Minimal requirements
The minimal requirement that needs to be fulfilled by the wrapped library is to provide a way to be seeded and reproducible. fast-check cannot offer replay capabilities if the underlying generators are not able to generate the same values from one run to another.
:::

:::warning Limitations
Please note that if not explictely defined, the arbitraries will not be able to shrink the generated values.
:::

Here are some examples of how external fake data libraries can be wrapped within fast-check.

### Seed-based (eg.: @faker-js/faker)

With [@faker-js/faker](https://www.npmjs.com/package/@faker-js/faker):

```js
import fc from 'fast-check';
import { faker } from '@faker-js/faker';

const fakerToArb = (fakerGen) => {
  return fc
    .noShrink(
      // shrink on a seed makes no sense
      fc.noBias(
        // same probability to generate each of the allowed integers
        fc.integer(),
      ),
    )
    .map((seed) => {
      faker.seed(seed); // seed the generator
      return fakerGen(); // call it
    });
};

const streetAddressArb = fakerToArb(faker.address.streetAddress);
const customArb = fakerToArb(() => faker.fake('{{name.lastName}}, {{name.firstName}} {{name.suffix}}'));
```

:::tip Recommended integration for Faker

Our recommended integration for Faker has changed since the release of the version 8.2.0 of Faker. We recommend you to have a look to [our article](/blog/2024/07/18/integrating-faker-with-fast-check/) on the subject.
:::

### Random-based (eg.: lorem-ipsum)

With [lorem-ipsum](https://www.npmjs.com/package/lorem-ipsum):

```js
import fc from 'fast-check';
import { loremIpsum } from 'lorem-ipsum';

const loremArb = fc
  .noShrink(
    fc.infiniteStream(
      // Arbitrary generating 32-bit floating point numbers
      // between 0 (included) and 1 (excluded) (uniform distribution)
      fc.noBias(fc.integer({ min: 0, max: (1 << 24) - 1 }).map((v) => v / (1 << 24))),
    ),
  )
  .map((s) => {
    const rng = () => s.next().value; // prng like Math.random but controlled by fast-check
    return loremIpsum({ random: rng });
  });
```
