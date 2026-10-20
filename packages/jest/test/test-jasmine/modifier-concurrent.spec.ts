import { describe } from 'vitest';
import { buildModifierConcurrentSpecsFor } from '../__test-helpers__/ModifierConcurrentSpecs.js';
import { testJasmineRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineRunOptions;
describe(`${options.runnerName}.concurrent`, () => {
  buildModifierConcurrentSpecsFor(options);
});
