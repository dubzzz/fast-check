---
sidebar_position: 6
slug: /ecosystem/
sidebar_label: Ecosystem
---

# 🌱 Ecosystem

Bring additional capabilities to fast-check by leveraging its rich ecosystem of extensions and plugins

:::warning Stability
This page provides a list of packages available in the fast-check ecosystem. It includes both official and third-party packages. While we can ensure the stability, usage, and maintenance of the official packages, we cannot provide any specific details or guarantees regarding the non-official packages.

<details>
<summary>Follow the emojis — <i>last update January 2024</i></summary>

- ⭐ official package
- 🌗 official package with limited support
- 🥇 active<sup>1</sup> non-official package with many downloads<sup>2</sup>
- 🥈 active<sup>1</sup> non-official package
- ⚠️ others

1: The package has been updated in the last twelve months
2: The package has been downloaded more than 1k times per month

In each section, packages marked with ⭐ and 🥇 will come first in alphabetical order, followed by 🥈 and then 🌗 and ⚠️.

</details>
:::

## Connectors

Create arbitraries based on other libraries.

For instance:

- Many data validators enable you to define and sometimes validate runtime values and obtain accurate TypeScript types. With these packages, they can also be utilized to derive arbitraries that can be seamlessly plugged within fast-check.
- Many fake data libraries come with powerful random and seeded generators, why don't you use them as arbitraries to ease migration path to full property-based testing?

### `@effect/schema` 🥇

![npm version](https://badge.fury.io/js/@effect%2Fschema.svg)
![monthly downloads](https://img.shields.io/npm/dm/@effect%2Fschema)
![last commit](https://img.shields.io/github/last-commit/effect-ts/effect)
![license](https://img.shields.io/npm/l/@effect%2Fschema.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Generate random values that conform to a given `Schema`. It allows you to generate random test data that is guaranteed to be valid according to the `Schema`.

```ts
import * as Arbitrary from '@effect/schema/Arbitrary';
import * as S from '@effect/schema/Schema';
import * as fc from 'fast-check';

const Person = S.struct({
  name: S.string,
  age: S.string.pipe(S.compose(S.NumberFromString), S.int()),
});
const isPerson = S.is(Person);
const personArbitrary = Arbitrary.make(Person)(fc);

test('Only generating valid Person', () => {
  fc.assert(
    fc.property(personArbitrary, (person) => {
      expect(isPerson(person)).toBe(true);
    }),
  );
});
```

More details on the [package itself](https://www.npmjs.com/package/@effect/schema)!

### `zod-fast-check` 🥇

![npm version](https://badge.fury.io/js/zod-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/zod-fast-check)
![last commit](https://img.shields.io/github/last-commit/DavidTimms/zod-fast-check)
![license](https://img.shields.io/npm/l/zod-fast-check.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [zod validators](https://zod.dev/) into arbitraries for fast-check.

```js
import * as z from 'zod';
import * as fc from 'fast-check';
import { ZodFastCheck } from 'zod-fast-check';

const User = z.object({ firstName: z.string(), lastName: z.string() });
const userArbitrary = ZodFastCheck().inputOf(User);

test("User's full name always contains their first and last names", () => {
  fc.assert(
    fc.property(userArbitrary, (user) => {
      const parsedUser = User.parse(user);
      const fullName = `${parsedUser.firstName} ${parsedUser.lastName}`;
      expect(fullName).toContain(user.firstName);
      expect(fullName).toContain(user.lastName);
    }),
  );
});
```

More details on the [package itself](https://www.npmjs.com/package/zod-fast-check)!

### `fast-check-io-ts` 🥈

![npm version](https://badge.fury.io/js/fast-check-io-ts.svg)
![monthly downloads](https://img.shields.io/npm/dm/fast-check-io-ts)
![last commit](https://img.shields.io/github/last-commit/giogonzo/fast-check-io-ts)
![license](https://img.shields.io/npm/l/fast-check-io-ts.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [io-ts validators](https://gcanti.github.io/io-ts/) into arbitraries for fast-check.
More details on the [package itself](https://www.npmjs.com/package/fast-check-io-ts)!

### `graphql-codegen-fast-check` ⚠️

![npm version](https://badge.fury.io/js/graphql-codegen-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/graphql-codegen-fast-check)
![last commit](https://img.shields.io/github/last-commit/danieljharvey/graphql-codegen-fast-check)
![license](https://img.shields.io/npm/l/graphql-codegen-fast-check.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [GraphQL schemas](https://graphql.org/) into arbitraries for fast-check.
More details on the [package itself](https://www.npmjs.com/package/graphql-codegen-fast-check)!

### `json-schema-fast-check` ⚠️

![npm version](https://badge.fury.io/js/json-schema-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/json-schema-fast-check)
![last commit](https://img.shields.io/github/last-commit/meeshkan/json-schema-fast-check)
![license](https://img.shields.io/npm/l/json-schema-fast-check.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [JSON Schemas](https://json-schema.org/) into arbitraries for fast-check.
More details on the [package itself](https://www.npmjs.com/package/json-schema-fast-check)!

### `idonttrustlikethat-fast-check` ⚠️

![npm version](https://badge.fury.io/js/idonttrustlikethat-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/idonttrustlikethat-fast-check)
![last commit](https://img.shields.io/github/last-commit/nielk/idonttrustlikethat-fast-check)
![license](https://img.shields.io/npm/l/idonttrustlikethat-fast-check.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [idonttrustlikethat validators](https://github.com/AlexGalays/idonttrustlikethat) into arbitraries for fast-check.
More details on the [package itself](https://www.npmjs.com/package/idonttrustlikethat-fast-check)!

### `mock-data-gen` ⚠️

![npm version](https://badge.fury.io/js/mock-data-gen.svg)
![monthly downloads](https://img.shields.io/npm/dm/mock-data-gen)
![last commit](https://img.shields.io/github/last-commit/kaeluka/mock-data-gen)
![license](https://img.shields.io/npm/l/mock-data-gen.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Convert [io-ts validators](https://gcanti.github.io/io-ts/) into arbitraries for fast-check.
More details on the [package itself](https://www.npmjs.com/package/mock-data-gen)!

### `jsverify-to-fast-check` 🌗

![npm version](https://badge.fury.io/js/jsverify-to-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/jsverify-to-fast-check)
![last commit](https://img.shields.io/github/last-commit/dubzzz/jsverify-to-fast-check)
![license](https://img.shields.io/npm/l/jsverify-to-fast-check.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

Ease your migration path to fast-check by easily converting the arbitraries you defined for [jsverify](http://jsverify.github.io/) into some for fast-check. While still maintained, we do not work actively on this project given the current state of jsverify: last released in 2018.

```js
import { jsc2fc } from 'jsverify-to-fast-check';
import * as jsc from 'jsverify';
import * as fc from 'fast-check';

// Here is an old arbitrary you prefer not to migrate for the moment
const jscArbitrary = jsc.bless({
  generator: jsc.generator.bless(() => {
    switch (jsc.random(0, 2)) {
      case 0:
        return 'foo';
      case 1:
        return 'bar';
      case 2:
        return 'quux';
    }
  }),
});

// It can easily converted into an arbitrary for fast-check using jsc2fc
const fcArbitrary = jsc2fc(jscArbitrary);
```

More details on the [package itself](https://www.npmjs.com/package/jsverify-to-fast-check)!

### `typespec-fast-check` 🥈

![npm version](https://badge.fury.io/js/typespec-fast-check.svg)
![monthly downloads](https://img.shields.io/npm/dm/typespec-fast-check)
![last commit](https://img.shields.io/github/last-commit/kaeluka/typespec-fast-check)
![license](https://img.shields.io/npm/l/typespec-fast-check.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Already using [TypeSpec](https://typespec.io) to describe your API and generate your OpenAPI spec, JSON schema, etc.? You can use [`typespec-fast-check`](https://github.com/TomerAberbach/typespec-fast-check) to also generate fast-check arbitraries from your TypeSpec files.

For example, the following TypeSpec file:

```tsp
model Person {
  /** The person's first name. */
  firstName: string;

  /** The person's last name. */
  lastName: string;

  /** Age in years which must be equal to or greater than zero. */
  @minValue(0) age: int32;

  /** Person address */
  address: Address;

  /** List of nick names */
  nickNames?: string[];

  /** List of cars person owns */
  cars?: Car[];
}

/** Represents an address */
model Address {
  street: string;
  city: string;
  country: string;
}
model Car {
  /** Kind of car */
  kind: "ev" | "ice";

  /** Brand of the car */
  brand: string;

  /** Model of the car */
  `model`: string;
}
```

Can generate the following fast-check arbitraries file:

```js
// Generated from TypeSpec using `typespec-fast-check`

import fc from 'fast-check';

export const Car = fc.record({
  /** Kind of car */
  kind: fc.constantFrom('ev', 'ice'),
  /** Brand of the car */
  brand: fc.string(),
  /** Model of the car */
  model: fc.string(),
});

/** Represents an address */
export const Address = fc.record({
  street: fc.string(),
  city: fc.string(),
  country: fc.string(),
});

export const Person = fc.record(
  {
    /** The person's first name. */
    firstName: fc.string(),
    /** The person's last name. */
    lastName: fc.string(),
    /** Age in years which must be equal to or greater than zero. */
    age: fc.nat(),
    /** Person address */
    address: Address,
    /** List of nick names */
    nickNames: fc.array(fc.string()),
    /** List of cars person owns */
    cars: fc.array(Car),
  },
  {
    requiredKeys: ['firstName', 'lastName', 'age', 'address'],
  },
);
```

More details on the [package itself](https://www.npmjs.com/package/typespec-fast-check)!

## Test runners

Although not designed for any particular test runners, some users prefer to have complete integration of fast-check within their preferred test runner. To meet these needs, we have compiled a list of packages that serve as the bridge between your favorite test runner and fast-check.

### `@fast-check/ava` ⭐

![npm version](https://badge.fury.io/js/@fast-check%2Fava.svg)
![monthly downloads](https://img.shields.io/npm/dm/@fast-check%2Fava)
![last commit](https://img.shields.io/github/last-commit/dubzzz/fast-check)
![license](https://img.shields.io/npm/l/@fast-check%2Fava.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

Bring support for property-based testing into [ava](https://www.npmjs.com/package/ava) with [@fast-check/ava](https://www.npmjs.com/package/@fast-check/ava).

```js
import { testProp, fc } from '@fast-check/ava';

testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (t, a, b, c) => {
  t.true((a + b + c).includes(b));
});
```

More details on the [package itself](https://www.npmjs.com/package/@fast-check/ava)!

### `@fast-check/jest` ⭐

![npm version](https://badge.fury.io/js/@fast-check%2Fjest.svg)
![monthly downloads](https://img.shields.io/npm/dm/@fast-check%2Fjest)
![last commit](https://img.shields.io/github/last-commit/dubzzz/fast-check)
![license](https://img.shields.io/npm/l/@fast-check%2Fjest.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

Bring support for property-based testing into [jest](https://www.npmjs.com/package/jest).

In addition to offering enhanced versions of `test` and `it` functions, this package seamlessly synchronizes the timeouts of fast-check with those of jest. You no longer need to worry about setting separate timeouts for fast-check when you have already defined one in jest. This package handles the integration effortlessly, ensuring everything gets wired out-of-the-box.

```js
import { test, fc } from '@fast-check/jest';

test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  return (a + b + c).includes(b);
});

test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  return (a + b + c).includes(b);
});
```

More details on the [package itself](https://www.npmjs.com/package/@fast-check/jest)!

### `@fast-check/vitest` ⭐

![npm version](https://badge.fury.io/js/@fast-check%2Fvitest.svg)
![monthly downloads](https://img.shields.io/npm/dm/@fast-check%2Fvitest)
![last commit](https://img.shields.io/github/last-commit/dubzzz/fast-check)
![license](https://img.shields.io/npm/l/@fast-check%2Fvitest.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

Bring support for property-based testing into [vitest](https://www.npmjs.com/package/vitest).

```js
import { test, fc } from '@fast-check/vitest';

test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  return (a + b + c).includes(b);
});

test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  return (a + b + c).includes(b);
});
```

More details on the [package itself](https://www.npmjs.com/package/@fast-check/vitest)!

## Superpowers

Although fast-check already includes an extensive set of capabilities, some features have been kept aside and have not been included within the core package. These additional packages offer some extra capabilities, such as more powerful checks or new runners.

### `@fast-check/poisoning` ⭐

![npm version](https://badge.fury.io/js/@fast-check%2Fpoisoning.svg)
![monthly downloads](https://img.shields.io/npm/dm/@fast-check%2Fpoisoning)
![last commit](https://img.shields.io/github/last-commit/dubzzz/fast-check)
![license](https://img.shields.io/npm/l/@fast-check%2Fpoisoning.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

Prototype poisoning is a commonly exploited vulnerability that can lead to various security weaknesses. Historical vulnerabilities in the ecosystem have been linked to prototype poisoning but detecting and addressing them is not always straightforward. The [@fast-check/poisoning](https://www.npmjs.com/package/@fast-check/poisoning) package has been specifically designed to address this need.

By utilizing this package in conjunction with fast-check, you can effectively safeguard against inadvertently modifying global prototypes when your code interacts with specially crafted inputs. Using both packages together unlocks their full potential and pushes your testing capabilities a step forward.

```js
import fc from 'fast-check';
import { assertNoPoisoning, restoreGlobals } from '@fast-check/poisoning';

const ignoredRootRegex = /^(__coverage__|console)$/;
function poisoningAfterEach() {
  try {
    assertNoPoisoning({ ignoredRootRegex });
  } catch (err) {
    restoreGlobals({ ignoredRootRegex });
    throw err;
  }
}
fc.configureGlobal({ afterEach: poisoningAfterEach });

test('should detect the substring', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
      expect(isSubstring(a + b + c, b)).toBe(true);
    }),
  );
});
```

More details on the [package itself](https://www.npmjs.com/package/@fast-check/poisoning)!

### `@fast-check/worker` ⭐

![npm version](https://badge.fury.io/js/@fast-check%2Fworker.svg)
![monthly downloads](https://img.shields.io/npm/dm/@fast-check%2Fworker)
![last commit](https://img.shields.io/github/last-commit/dubzzz/fast-check)
![license](https://img.shields.io/npm/l/@fast-check%2Fworker.svg)
![official package](https://img.shields.io/badge/-official%20package-%23ffcb00.svg)

By default fast-check does not change where the code runs: everything run within the original process. [@fast-check/worker](https://www.npmjs.com/package/@fast-check/worker) package allows you to delegate the execution of predicates to dedicated worker threads. It brings several advantages, including the ability to stop synchronously running predicates.

```js
import { test, expect } from '@jest/globals';
import fc from 'fast-check';
import { isMainThread } from 'node:worker_threads';
import { assert, propertyFor } from '@fast-check/worker';

const property = propertyFor(new URL(import.meta.url)); // or propertyFor(pathToFileURL(__filename)) in commonjs
const isSubstringProperty = property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
  expect(isSubstring(a + b + c, b)).toBe(true);
});

if (isMainThread) {
  test('should detect the substring', async () => {
    await assert(isSubstringProperty, { timeout: 1000 });
  });
}
```

:::info Integration with Jest runner
`@fast-check/worker` is directly integrating with `@fast-check/jest`. Checkout the [official documentation of `@fast-check/jest`](https://www.npmjs.com/package/@fast-check/jest) for more details.
:::

More details on the [package itself](https://www.npmjs.com/package/@fast-check/worker)!

## Validators

External libraries leveraging fast-check, its properties and predicates to validate userland extensions.

### `fp-ts-laws` 🥇

![npm version](https://badge.fury.io/js/fp-ts-laws.svg)
![monthly downloads](https://img.shields.io/npm/dm/fp-ts-laws)
![last commit](https://img.shields.io/github/last-commit/gcanti/fp-ts-laws)
![license](https://img.shields.io/npm/l/fp-ts-laws.svg)
![third party package](https://img.shields.io/badge/-third%20party%20package-%2300abff.svg)

Make sure your [fp-ts](https://gcanti.github.io/fp-ts/) constructs are properly configured.
More details on the [package itself](https://www.npmjs.com/package/fp-ts-laws)!
