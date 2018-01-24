import * as assert from 'power-assert';
import * as fc from '../../../../lib/fast-check';

import { boolean } from '../../../../src/check/arbitrary/BooleanArbitrary';

import * as stubRng from '../../stubs/generators';

describe("BooleanArbitrary", () => {
    describe('boolean', () => {
        it('Should produce true and false uniformaly', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.counter(seed);
                const g1 = boolean().generate(mrng).value;
                const g2 = boolean().generate(mrng).value;
                return (g1 === true && g2 === false) || (g1 === false && g2 === true);
            })
        ));
    });
});
