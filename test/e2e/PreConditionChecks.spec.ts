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
    expect(out.failed).toBe(true);
  });
  it('should not failed when no skips on no skips allowed', () => {
    const out = fc.check(fc.property(fc.integer(), fc.integer(), (x, y) => true), { maxSkipsPerRun: 0 });
    expect(out.failed).toBe(false);
  });
});
