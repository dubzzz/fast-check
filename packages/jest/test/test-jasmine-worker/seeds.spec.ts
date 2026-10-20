import { describe } from 'vitest';
import { buildSeedsSpecsFor } from '../__test-helpers__/SeedsSpecs.js';
import { testJasmineWorkerRunOptions } from '../__test-helpers__/RunOptions.js';

const options = testJasmineWorkerRunOptions;
describe(`${options.runnerName} [seeds]`, () => {
  buildSeedsSpecsFor(options);
});
