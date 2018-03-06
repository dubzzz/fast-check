import * as assert from 'power-assert';
import fc from '../../../src/fast-check';

const seed = Date.now();
describe(`CharacterArbitrary (seed: ${seed})`, () => {
    describe('fullUnicode', () => {
        it('Should shrink towards a character of size greater than one', () => {
            const out = fc.check(fc.property(fc.fullUnicode(), (s:string) => s.length === 1), {seed: seed});
            assert.ok(out.failed, 'Should have failed');
            assert.ok(out.counterexample[0].length > 1);
        });
    });
});
