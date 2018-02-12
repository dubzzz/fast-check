import * as assert from 'power-assert';
import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`StringArbitrary (seed: ${seed})`, () => {
    describe('base64String', () => {
        it('Should shrink on base64 containing no equal signs', () => {
            const out = fc.check(fc.property(fc.base64String(), (s:string) => /^\w*$/.exec(s) == null), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, [""], 'Should shrink to counterexample ""');
        });
        it('Should shrink on base64 containing one equal signs', () => {
            const out = fc.check(fc.property(fc.base64String(), (s:string) => /^\w+=$/.exec(s) == null), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, ["AAA="], 'Should shrink to counterexample "AAA="');
        });
        it('Should shrink on base64 containing two equal signs', () => {
            const out = fc.check(fc.property(fc.base64String(), (s:string) => /^\w+==$/.exec(s) == null), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, ["AA=="], 'Should shrink to counterexample "AA=="');
        });
    });
    describe('unicodeString', () => {
        it('Should produce valid UTF-16 strings', () => {
            fc.assert(fc.property(fc.unicodeString(), (s:string) => encodeURIComponent(s) !== null), {seed: seed});
        });
    });
    describe('fullUnicodeString', () => {
        it('Should produce valid UTF-16 strings', () => {
            fc.assert(fc.property(fc.fullUnicodeString(), (s:string) => encodeURIComponent(s) !== null), {seed: seed});
        });
    });
    describe('string16bits', () => {
        it('Should be able to produce invalid UTF-16 strings', () => {
            const out = fc.check(fc.property(fc.string16bits(), (s:string) => encodeURIComponent(s) !== null), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.deepEqual(out.counterexample, ['\ud800'], 'Should shrink to counterexample "\\ud800"');
        });
    });
});
