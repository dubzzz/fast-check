import { describe } from 'vitest';
import { buildModifierConcurrentSpecsFor } from '../__test-helpers__/ModifierConcurrentSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(`${options.runnerName}.concurrent`, () => {
  buildModifierConcurrentSpecsFor(options);
});
