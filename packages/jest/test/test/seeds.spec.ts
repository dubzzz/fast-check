import { describe } from 'vitest';
import { buildSeedsSpecsFor } from '../__test-helpers__/SeedsSpecs.js';
import { testRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testRunOptions;
describe(`${options.runnerName} [seeds]`, () => {
  buildSeedsSpecsFor(options);
});
