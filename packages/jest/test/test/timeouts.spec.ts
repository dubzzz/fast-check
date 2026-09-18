import { describe } from 'vitest';
import { buildTimeoutsSpecsFor } from '../__test-helpers__/TimeoutsSpecs.js';
import { testRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testRunOptions;
describe(`${options.runnerName} [timeouts]`, () => {
  buildTimeoutsSpecsFor(options);
});
