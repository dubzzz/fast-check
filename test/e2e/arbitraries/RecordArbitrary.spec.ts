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
        it('Should shrink on a record with bb as single key', () => {
            const recordModel = {
                aa: fc.integer(),
                bb: fc.object(),
                cc: fc.string()
            };
            const out = fc.check(fc.property(fc.record(recordModel, {with_deleted_keys: true}), (obj: any) => obj['bb'] == null), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [{bb:{}}], 'Should shrink to counterexample {bb: {}}');
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
            const out = fc.check(fc.property(fc.record(recordModel, {with_deleted_keys: true}), (obj: any) => {
                if (obj.force_positive_output === true && obj.force_negative_output === true)
                    return false;
                return true;
            }), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [{force_positive_output:true,force_negative_output:true}], 'Should shrink to counterexample {force_positive_output:true,force_negative_output:true}');
        });
    });
});
