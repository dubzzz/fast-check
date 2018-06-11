import * as assert from 'assert';
import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`PreConditionChecks (seed: ${seed})`, () => {
  it('should skip property execution whenever pre fails', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (x, y) => {
        fc.pre(x < y);
        return x < y;
      })
    );
  });
  it('should consider run as failure on too many pre failures', () => {
    const out = fc.check(
      fc.property(fc.integer(), fc.integer(), (x, y) => {
        fc.pre(false);
        return true;
      })
    );
    assert.ok(out.failed);
  });
});
