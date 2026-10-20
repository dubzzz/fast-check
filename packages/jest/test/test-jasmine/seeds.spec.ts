import { describe } from 'vitest';
import { buildSeedsSpecsFor } from '../__test-helpers__/SeedsSpecs.js';
import { testJasmineRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineRunOptions;
describe(`${options.runnerName} [seeds]`, () => {
  buildSeedsSpecsFor(options);
});
