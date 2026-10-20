import { describe } from 'vitest';
import { buildModifierConcurrentSpecsFor } from '../__test-helpers__/ModifierConcurrentSpecs.js';
import { testRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testRunOptions;
describe(`${options.runnerName}.concurrent`, () => {
  buildModifierConcurrentSpecsFor(options);
});
