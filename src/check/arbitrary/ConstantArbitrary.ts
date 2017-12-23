import Arbitrary from './Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class ConstantArbitrary<T> extends Arbitrary<T> {
    constructor(readonly value: T) {
        super();
    }
    generate(mrng: MutableRandomGenerator): T {
        return this.value;
    }
}

function constant<T>(value: T): ConstantArbitrary<T> {
    return new ConstantArbitrary<T>(value);
}

export { constant };
