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
});
