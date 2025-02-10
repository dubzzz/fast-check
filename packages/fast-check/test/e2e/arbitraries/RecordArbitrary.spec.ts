import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`RecordArbitrary (seed: ${seed})`, () => {
  describe('record', () => {
    it('Should shrink on the minimal failing record', () => {
      const recordModel = {
        aa: fc.integer(),
        bb: fc.object(),
        cc: fc.string(),
      };
      const out = fc.check(
        fc.property(fc.record(recordModel), (obj) => obj.cc.length <= 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ aa: 0, bb: {}, cc: '   ' }]);
    });
    it('Should shrink on a record with bb as single key', () => {
      const recordModel = {
        aa: fc.integer(),
        bb: fc.object(),
        cc: fc.string(),
      };
      const out = fc.check(
        fc.property(fc.record(recordModel, { requiredKeys: [] }), (obj) => obj.bb == null),
        {
          seed: seed,
        },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ bb: {} }]);
    });
    it('Should shrink on the failing conjonction of keys', () => {
      const recordModel = {
        enableA: fc.boolean(),
        enableB: fc.boolean(),
        enableC: fc.boolean(),
        enableD: fc.boolean(),
        forcePositiveOutput: fc.boolean(),
        forceNegativeOutput: fc.boolean(),
      };
      const out = fc.check(
        fc.property(fc.record(recordModel, { requiredKeys: [] }), (obj) => {
          if (obj.forcePositiveOutput === true && obj.forceNegativeOutput === true) return false;
          return true;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ forcePositiveOutput: true, forceNegativeOutput: true }]);
    });
  });
});
