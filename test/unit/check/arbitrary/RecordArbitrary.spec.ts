import * as assert from 'assert';
import prand from 'pure-rand';
import fc from '../../../../lib/fast-check';

import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { record } from '../../../../src/check/arbitrary/RecordArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('RecordArbitrary', () => {
  describe('record', () => {
    it('Should produce a record having the right keys', () =>
      fc.assert(
        fc.property(fc.set(fc.string()), fc.integer(), (keys, seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const expectedRecord = {};
          const recordModel = {};
          for (const k of keys) {
            expectedRecord[k] = `_${k}_`;
            recordModel[k] = stubArb.single(`_${k}_`);
          }
          const g = record(recordModel).generate(mrng).value;
          assert.deepStrictEqual(g, expectedRecord);
        })
      ));
    it('Should produce a record with missing keys', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), 1, 10), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.mersenne(seed));
          const recordModel = {};
          for (const k of keys) recordModel[k] = constant(`_${k}_`);

          const arb = record(recordModel, { with_deleted_keys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (!g.hasOwnProperty(keys[missingIdx % keys.length])) return true;
          }
          return false;
        })
      ));
    it('Should produce a record with present keys', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), 1, 10), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.mersenne(seed));
          const recordModel = {};
          for (const k of keys) recordModel[k] = constant(`_${k}_`);

          const arb = record(recordModel, { with_deleted_keys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (g[keys[missingIdx % keys.length]] === `_${keys[missingIdx % keys.length]}_`) return true;
          }
          return false;
        })
      ));
  });
});
