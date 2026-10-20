import { describe } from 'vitest';
import { buildBaseSpecsFor } from '../__test-helpers__/BaseSpecs.js';
import { testJasmineRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineRunOptions;
describe(options.runnerName, () => {
  buildBaseSpecsFor(options);
});
