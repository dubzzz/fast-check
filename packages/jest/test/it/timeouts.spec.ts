import { describe } from 'vitest';
import { buildTimeoutsSpecsFor } from '../__test-helpers__/TimeoutsSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(`${options.runnerName} [timeouts]`, () => {
  buildTimeoutsSpecsFor(options);
});
