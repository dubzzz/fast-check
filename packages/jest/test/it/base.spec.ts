import { describe } from 'vitest';
import { buildBaseSpecsFor } from '../__test-helpers__/BaseSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(options.runnerName, () => {
  buildBaseSpecsFor(options);
});
