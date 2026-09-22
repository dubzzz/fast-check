import { describe } from 'vitest';
import { buildModifierSkipSpecsFor } from '../__test-helpers__/ModifierSkipSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(`${options.runnerName}.skip`, () => {
  buildModifierSkipSpecsFor(options);
});
