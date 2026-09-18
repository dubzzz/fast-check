import { describe } from 'vitest';
import { buildModifierFailingSpecsFor } from '../__test-helpers__/ModifierFailingSpecs.js';
import { testRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testRunOptions;
describe(`${options.runnerName}.failing`, () => {
  buildModifierFailingSpecsFor(options);
});
