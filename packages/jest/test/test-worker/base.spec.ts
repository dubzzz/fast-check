import { describe } from 'vitest';
import { buildBaseSpecsFor } from '../__test-helpers__/BaseSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(options.runnerName, () => {
  buildBaseSpecsFor(options);
});
