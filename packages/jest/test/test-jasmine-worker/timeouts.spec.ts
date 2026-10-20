import { describe } from 'vitest';
import { buildTimeoutsSpecsFor } from '../__test-helpers__/TimeoutsSpecs.js';
import { testJasmineWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineWorkerRunOptions;
describe(`${options.runnerName} [timeouts]`, () => {
  buildTimeoutsSpecsFor(options);
});
