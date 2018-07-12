import * as assert from 'assert';
import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`WithProvidedExamples (seed: ${seed})`, () => {
  it('should fail on one of the provided examples', () => {
    // no shrink on examples for the moment
    const out = fc.check(fc.property(fc.integer(-100, -1), fc.integer(1, 100), (x, y) => x < y), {
      examples: [[0, 1], [42, 42], [1, 100]]
    });
    assert.ok(out.failed);
    assert.deepStrictEqual(out.counterexample, [42, 42]);
  });
  it('should fail after examples', () => {
    const out = fc.check(fc.property(fc.integer(), fc.integer(), (x, y) => x < y), {
      examples: [[0, 1], [42, 43], [1, 100]]
    });
    assert.ok(out.failed);
    assert.ok(out.counterexample![0] >= out.counterexample![1]);
  });
});
