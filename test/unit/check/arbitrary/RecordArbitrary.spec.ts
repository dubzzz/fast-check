import * as assert from 'power-assert';
import * as fc from '../../../../lib/fast-check';

import { record } from '../../../../src/check/arbitrary/RecordArbitrary';
import MersenneTwister from '../../../../src/random/generator/MersenneTwister';
import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe("RecordArbitrary", () => {
    describe('record', () => {
        it('Should produce a record having the right keys', () => fc.assert(
            fc.property(fc.array(fc.string()), fc.integer(), (keys, seed) => {
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
    });
});
