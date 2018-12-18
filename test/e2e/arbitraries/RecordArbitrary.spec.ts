import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`RecordArbitrary (seed: ${seed})`, () => {
  describe('record', () => {
    it('Should shrink on the minimal failing record', () => {
      const recordModel = {
        aa: fc.integer(),
        bb: fc.object(),
        cc: fc.string()
      };
      const out = fc.check(fc.property(fc.record(recordModel), obj => obj.cc.length <= 2), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ aa: 0, bb: {}, cc: '   ' }]);
    });
    it('Should shrink on a record with bb as single key', () => {
      const recordModel = {
        aa: fc.integer(),
        bb: fc.object(),
        cc: fc.string()
      };
      const out = fc.check(fc.property(fc.record(recordModel, { withDeletedKeys: true }), obj => obj.bb == null), {
        seed: seed
      });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ bb: {} }]);
    });
    it('Should shrink on the failing conjonction of keys', () => {
      const recordModel = {
        enable_a: fc.boolean(),
        enable_b: fc.boolean(),
        enable_c: fc.boolean(),
        enable_d: fc.boolean(),
        force_positive_output: fc.boolean(),
        force_negative_output: fc.boolean()
      };
      const out = fc.check(
        fc.property(fc.record(recordModel, { withDeletedKeys: true }), obj => {
          if (obj.force_positive_output === true && obj.force_negative_output === true) return false;
          return true;
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ force_positive_output: true, force_negative_output: true }]);
    });
  });
});
