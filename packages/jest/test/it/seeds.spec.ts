import { describe } from 'vitest';
import { buildSeedsSpecsFor } from '../__test-helpers__/SeedsSpecs.js';
import { itRunOptions } from '../__test-helpers__/RunOptions.js';

const options = itRunOptions;
describe(`${options.runnerName} [seeds]`, () => {
  buildSeedsSpecsFor(options);
});
