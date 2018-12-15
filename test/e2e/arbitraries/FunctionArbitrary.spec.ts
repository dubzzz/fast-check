import * as assert from 'assert';
import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`FunctionArbitrary (seed: ${seed})`, () => {
  describe('func', () => {
    it('Should be able to generate multiple values', () => {
      const out = fc.check(fc.property(fc.func(fc.nat()), fc.integer(), fc.integer(), (f, a, b) => f(a) === f(b)), {
        seed: seed
      });
      assert.ok(out.failed, 'Should have failed');
    });
    it('Should print the values and corresponding outputs', () => {
      try {
        fc.assert(
          fc.property(fc.func(fc.nat()), f => {
            f(0, 8);
            f(42, 1);
            return false;
          }),
          { seed: seed }
        );
        assert.fail('Should have failed');
      } catch (err) {
        assert.ok(err.message.indexOf('Counterexample: [<function :: [0,8] => 0, [42,1] => 0>]') !== -1);
      }
    });
  });
  describe('compareFunc', () => {
    it('Should be able to find equivalence between distinct values', () => {
      const out = fc.check(
        fc.property(fc.compareFunc(), fc.string(), fc.string(), (f, a, b) => {
          fc.pre(a !== b);
          return f(a, b) !== 0;
        }),
        {
          seed: seed,
          numRuns: 5000 // increased numRuns to remove flakiness
        }
      );
      assert.ok(out.failed, 'Should have failed (ie. there is (a, b) such that a != b and a equivalent to b under f)');
      const counter = out.counterexample!;
      assert.equal(counter[0](counter[1], counter[2]), 0);
    });
  });
});
