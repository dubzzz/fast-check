import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';
import { oneof } from '../../../src/check/arbitrary/OneOfArbitrary';
import * as jsc from 'jsverify';

describe("OneOfArbitrary", () => {
    describe('constant', () => {
        it('Should generate based on one of the given arbitraries', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer, jsc.array(jsc.integer), (seed, choice1, others) => {
                const choices = [choice1, ...others];
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = oneof(constant(choice1), ...others.map(constant)).generate(mrng).value;
                return choices.indexOf(g) !== -1;
            })
        ));
    });
});
