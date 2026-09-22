import { describe } from 'vitest';
import { buildModifierSkipSpecsFor } from '../__test-helpers__/ModifierSkipSpecs.js';
import { testRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testRunOptions;
describe(`${options.runnerName}.skip`, () => {
  buildModifierSkipSpecsFor(options);
});
