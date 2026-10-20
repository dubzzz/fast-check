import { describe } from 'vitest';
import { buildSeedsSpecsFor } from '../__test-helpers__/SeedsSpecs.js';
import { testWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testWorkerRunOptions;
describe(`${options.runnerName} [seeds]`, () => {
  buildSeedsSpecsFor(options);
});
