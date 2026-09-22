import { describe } from 'vitest';
import { buildTimeoutsSpecsFor } from '../__test-helpers__/TimeoutsSpecs.js';
import { testJasmineRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineRunOptions;
describe(`${options.runnerName} [timeouts]`, () => {
  buildTimeoutsSpecsFor(options);
});
