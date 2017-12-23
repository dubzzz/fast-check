import Arbitrary from './Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { nat } from './IntegerArbitrary'

class OneOfArbitrary<T> extends Arbitrary<T> {
    readonly idArb: Arbitrary<number>;
    constructor(readonly arbs: Arbitrary<T>[]) {
        super();
        this.idArb = nat(arbs.length -1);
    }
    generate(mrng: MutableRandomGenerator): T {
        const id = this.idArb.generate(mrng);
        return this.arbs[id].generate(mrng);
    }
}

function oneof<T>(arb1: Arbitrary<T>, ...arbs: Arbitrary<T>[]): Arbitrary<T> {
    return new OneOfArbitrary([arb1, ...arbs]);
}

export { oneof };
