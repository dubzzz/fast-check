# Contributing to fast-check

🐱 First off, thanks for taking the time to contribute! 🐱

The following is a set of guidelines for contributing to fast-check and its packages.
These are mostly guidelines, not rules.
Use your best judgment, and feel free to propose changes to this document in a pull request.

**Feel free to contribute, ask questions, report bugs and issue pull requests**

## How Can I Contribute?

### Asking questions

Before asking questions, please double-check you can not find your answer in one of the examples provided or in the documentation of the project:

- [Documentation](https://github.com/dubzzz/fast-check/blob/main/README.md)
- [Examples provided inside the project](https://github.com/dubzzz/fast-check/tree/main/example)
- [Examples of properties](https://github.com/dubzzz/fast-check-examples)
- [Example: fuzzing a REST API](https://github.com/dubzzz/fuzz-rest-api)

If nothing answered your question, please do not hesitate to [create a new issue in GitHub](https://github.com/dubzzz/fast-check/issues).

### Reporting bugs

You should report bugs using [create a new issue in GitHub](https://github.com/dubzzz/fast-check/issues).

### Issuing pull requests

#### Getting started

In order to start playing with the code locally you must run the following set of commands:

```bash
git clone https://github.com/dubzzz/fast-check.git && cd fast-check
yarn
yarn build    #compile the code in ./src, build the ./lib content
```

Once done, everything is ready for you to start working on the code.

#### Code style

Code style standard is enforced by Prettier.
Once done with your development you can check it follow the recommended code style by running `yarn format:check` or run autofixes with `yarn format`.

You should also check for linting by running `yarn lint:check` and fix lint problems with `yarn lint`.

#### Travis CI integration

All pull requests will trigger Travis CI builds.
It ensures that the pull request follow the code style of the project and do not break existing tests.

#### Update your PR

If you plan to update your PR with either a fix for the tests or change following code reviews please directly commit your new commit in your branch, PR will get updated automatically.

Before your fix:

```
--*---> main    on dubzzz/fast-check
   \
   #1   branch-pr on your fork
```

After your fix:

```
--*--->        main    on dubzzz/fast-check
   \
   #1 --- #2   branch-pr on your fork
```

#### Resync PR with main

Ideally to resync your branch with main prefer a merge of main branch into your PR branch. It has the advantage to preserves the commit history on GitHub PR (contrary to rebase and force push).

### Examples

#### Adding a new arbitrary

✔️ _Create a feature request_

Before adding any new arbitrary into fast-check please make sure to fill a `Feature request` to justify the need for such arbitrary.

✔️ _Code the arbitrary_

All the arbitraries defined by fast-check are available in `src/arbitrary`.
Create a new file for the new one if it does not fit into the existing ones.

✔️ _Test the arbitrary_

Most of the newly added arbitraries will just be a combination of existing ones (mostly mapping from one entry to another).
We expect a quite minimal amount of tests to be added as most of the logic depends on the built-in blocks.

- _Unit-test_ &amp; _Integration_ - in `test/unit/arbitrary`

```js
import * as fc from '../../../lib/fast-check';
import { myArbitrary } from '../../../../src/arbitrary/MyArbitrary';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
} from './__test-helpers__/NextArbitraryAssertions';

describe('myArbitrary', () => {
  // Tests in isolation!
  // You may want to check that generate, canShrinkWithoutContext and shrink
  // are working as expecting given mocked or stubbed data (see our usage of spies).
});

describe('myArbitrary (integration)', () => {
  // Tests in real life!
  // In this section we assess that the arbitrary will work as expected by calling it with a real random generator
  // and without mocking any of its underlyings. In order to do that we have an already predefined set of helpers.
  // Among those helpers only some are really compulsory as they will ensure that the arbitrary does not break the
  // rules. The other ones tend to have the best possible version of the arbitrary by ensuring the shrinker will
  // always shrink towards strictly smaller values or that user defined values can be shrunk.

  type Extra = /* Typing for the extra props received by myArbitraryBuilder */;
  const extraParameters: fc.Arbitrary<Extra> = /* Arbitrary producing values for myArbitraryBuilder */;

  const isCorrect = (value: /* Type of the value */, extra: Extra) => {
    // Returns true if the value is correct given extra
    // Returs false or throws (possibly via expect) if value is invalid
  };

  const isStrictlySmaller = (vNew: /* Type of the value */, vOld: /* Type of the value */, extra: Extra) => {
    // Returns true if the vNew is really strictly smaller than vOld
    // Returs false or throws (possibly via expect) otherwise
  };

  const myArbitraryBuilder = (extra: Extra) => convertToNext(myArbitrary(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(myArbitraryBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(myArbitraryBuilder, isCorrect, { extraParameters });
  });

  // OPTIONAL STEP
  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(myArbitraryBuilder, { extraParameters });
  });

  // OPTIONAL STEP
  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(myArbitraryBuilder, { extraParameters });
  });

  // OPTIONAL STEP
  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(myArbitraryBuilder, isStrictlySmaller, { extraParameters });
  });
});
```

- No regression test - in `test/e2e/NoRegression.spec.ts`

Then run `yarn e2e -- -u` locally to update the snapshot file. The `NoRegression` spec is supposed to prevent unwanted breaking changes to be included in a future release of fast-check by taking a snapshot of the current output and enforcing it does not change over time (except if needed).

- Legacy support test - in `test/legacy/main.js`

The `legacy` spec is responsible to check that most of the arbitraries provided by fast-check are working fine on very old releases of node.

- Typing test - in `test/type/main.ts`

The `type` spec is responsible to check that the typings are correct but they also ensure that they will not break with future changes or upcoming releases of TypeScript.

✔️ _Document the arbitrary_

- Provide a minimal JSDoc on top of your new arbitrary and use the `/** @internal */` tag to hide internals - otherwise they would get published into the generated documentation

- Add the arbitrary into the list of Built-in Arbitraries - see https://github.com/dubzzz/fast-check/blob/main/documentation/Arbitraries.md
