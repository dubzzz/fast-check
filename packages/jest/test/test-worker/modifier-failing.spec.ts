import { describe } from 'vitest';
import { buildModifierFailingSpecsFor } from '../__test-helpers__/ModifierFailingSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(`${options.runnerName}.failing`, () => {
  buildModifierFailingSpecsFor(options);
});
