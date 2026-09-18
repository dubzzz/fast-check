import { describe } from 'vitest';
import { buildModifierSkipSpecsFor } from '../__test-helpers__/ModifierSkipSpecs.js';
import { testJasmineWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineWorkerRunOptions;
describe(`${options.runnerName}.skip`, () => {
  buildModifierSkipSpecsFor(options);
});
