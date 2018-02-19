import * as assert from 'power-assert';
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
            const out = fc.check(fc.property(fc.record(recordModel), (obj: any) => obj['cc'].length <= 2), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [{aa:0,bb:{},cc:"   "}], 'Should shrink to counterexample {aa: 0, bb: {}, cc: "   "}');
        });
    });
});
