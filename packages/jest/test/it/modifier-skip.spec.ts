import { describe } from 'vitest';
import { buildModifierSkipSpecsFor } from '../__test-helpers__/ModifierSkipSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(`${options.runnerName}.skip`, () => {
  buildModifierSkipSpecsFor(options);
});
