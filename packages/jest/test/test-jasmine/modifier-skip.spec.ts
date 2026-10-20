import { describe } from 'vitest';
import { buildModifierSkipSpecsFor } from '../__test-helpers__/ModifierSkipSpecs.js';
import { testJasmineRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineRunOptions;
describe(`${options.runnerName}.skip`, () => {
  buildModifierSkipSpecsFor(options);
});
