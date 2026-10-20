import { describe } from 'vitest';
import { buildModifierConcurrentSpecsFor } from '../__test-helpers__/ModifierConcurrentSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(`${options.runnerName}.concurrent`, () => {
  buildModifierConcurrentSpecsFor(options);
});
