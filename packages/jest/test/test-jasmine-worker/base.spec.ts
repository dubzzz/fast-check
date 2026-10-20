import { describe } from 'vitest';
import { buildBaseSpecsFor } from '../__test-helpers__/BaseSpecs.js';
import { testJasmineWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineWorkerRunOptions;
describe(options.runnerName, () => {
  buildBaseSpecsFor(options);
});
