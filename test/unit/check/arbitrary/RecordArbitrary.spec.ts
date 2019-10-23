import * as prand from 'pure-rand';
import * as fc from '../../../../lib/fast-check';

import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { record, RecordConstraints } from '../../../../src/check/arbitrary/RecordArbitrary';
import { Random } from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';

describe('RecordArbitrary', () => {
  describe('record', () => {
    it('Should produce a record with missing keys', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), 1, 10), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const recordModel: { [key: string]: Arbitrary<string> } = {};
          for (const k of keys) recordModel[k] = constant(`_${k}_`);

          const arb = record(recordModel, { withDeletedKeys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (!Object.prototype.hasOwnProperty.call(g, keys[missingIdx % keys.length])) return true;
          }
          return false;
        })
      ));
    it('Should produce a record with present keys', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), 1, 10), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const recordModel: { [key: string]: Arbitrary<string> } = {};
          for (const k of keys) recordModel[k] = constant(`_${k}_`);

          const arb = record(recordModel, { withDeletedKeys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (g[keys[missingIdx % keys.length]] === `_${keys[missingIdx % keys.length]}_`) return true;
          }
          return false;
        })
      ));

    type Meta = { key: string; valueStart: number };
    const metaArbitrary = fc.set(
      fc.record({ key: fc.string(), valueStart: fc.nat(1000) }),
      (v1, v2) => v1.key === v2.key
    );
    const constraintsArbitrary = fc.record({ withDeletedKeys: fc.boolean() }, { withDeletedKeys: true });

    describe('Given a custom record configuration', () => {
      genericHelper.isValidArbitrary(
        ([metas, constraints]: [Meta[], RecordConstraints]) => {
          const recordModel: { [key: string]: Arbitrary<number> } = {};
          for (const m of metas) {
            recordModel[m.key] = integer(m.valueStart, m.valueStart + 10);
          }
          return record(recordModel, constraints);
        },
        {
          seedGenerator: fc.tuple(metaArbitrary, constraintsArbitrary),
          isValidValue: (r: { [key: string]: number }, [metas, constraints]: [Meta[], RecordConstraints]) => {
            for (const k of Object.keys(r)) {
              // generated object should not have more keys
              if (metas.findIndex(m => m.key === k) === -1) return false;
            }
            for (const m of metas) {
              // values are associated to the right key (if key required)
              if (constraints.withDeletedKeys === true && !Object.prototype.hasOwnProperty.call(r, m.key)) continue;
              if (typeof r[m.key] !== 'number') return false;
              if (r[m.key] < m.valueStart) return false;
              if (r[m.key] > m.valueStart + 10) return false;
            }
            return true;
          }
        }
      );
    });
  });
});
