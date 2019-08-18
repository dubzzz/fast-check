# Contributing to fast-check

🐱 First off, thanks for taking the time to contribute! 🐱

The following is a set of guidelines for contributing to fast-check and its packages.
These are mostly guidelines, not rules.
Use your best judgment, and feel free to propose changes to this document in a pull request.

**Feel free to contribute, ask questions, report bugs and issue pull requests**

## How Can I Contribute?

### Asking questions

Before asking questions, please double-check you can not find your answer in one of the examples provided or in the documentation of the project:

- [Documentation](https://github.com/dubzzz/fast-check/blob/master/README.md)
- [Examples provided inside the project](https://github.com/dubzzz/fast-check/tree/master/example)
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
npm install
npm run prebuild #generate missing implementations: tuple and properties
npm run build    #compile the code in ./src, build the ./lib content
```

Once done, everything is ready for you to start working on the code.

#### Code style

Code style standard is enforced by Prettier.
Once done with your development you can check it follow the recommended code style by running `npm run format:check` or run autofixes with `npm run format:fix`.

You should also check for linting by running `npm run lint:check`.

#### Travis CI integration

All pull requests will trigger Travis CI builds.
It ensures that the pull request follow the code style of the project and do not break existing tests.

#### Adding a new arbitrary

✔️ *Create a feature request*

Before adding any new arbitrary into fast-check please make sure to fill a `Feature request` to justify the need for such arbitrary.

✔️ *Code the arbitrary*

All the arbitraries defined by fast-check are available in `src/check/arbitrary`.
Create a new file for the new one if it does not fit into the existing ones.

✔️ *Test the arbitrary*

Most of the newly added arbitraries will just be a combination of existing ones (mostly mapping from one entry to another).
We expect a quite minimal amount of tests to be added as most of the logic depends on the built-in blocks.

- *Unit-test* - in `test/unit/check/arbitrary`

```js
import { myArb } from '../../../../src/check/arbitrary/MyArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';

describe('MyArbitrary', () => {
  describe('myArb', () => {
    // genericHelper.isValidArbitrary is repsonsible to ensure that the arbitrary is valid
    // and fulfill the minimum requirements asked by fast-check
    genericHelper.isValidArbitrary((settings) => myArb(settings), {
      isValidValue: (g: MyArbGeneratedType, settings) => isValidMyArbOutput(g),
      seedGenerator: anArbitraryProducingSettingsExpectedByMyArb // optional field
    });
  });
});
```

- No regression test - in `test/e2e/NoRegression.spec.ts`
- Legacy support test - in `test/legacy/main.js`
