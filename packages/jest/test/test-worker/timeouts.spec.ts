import { describe } from 'vitest';
import { buildTimeoutsSpecsFor } from '../__test-helpers__/TimeoutsSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(`${options.runnerName} [timeouts]`, () => {
  buildTimeoutsSpecsFor(options);
});
