import { describe } from 'vitest';
import { buildModifierFailingSpecsFor } from '../__test-helpers__/ModifierFailingSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(`${options.runnerName}.failing`, () => {
  buildModifierFailingSpecsFor(options);
});
