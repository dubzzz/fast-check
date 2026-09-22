import { describe } from 'vitest';
import { buildModifierConcurrentSpecsFor } from '../__test-helpers__/ModifierConcurrentSpecs.js';
import { testJasmineWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineWorkerRunOptions;
describe(`${options.runnerName}.concurrent`, () => {
  buildModifierConcurrentSpecsFor(options);
});
