import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class ConstantArbitrary<T> extends Arbitrary<T> {
    constructor(readonly value: T) {
        super();
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<T> {
        return new Shrinkable(this.value);
    }
}

function constant<T>(value: T): Arbitrary<T> {
    return new ConstantArbitrary<T>(value);
}

export { constant };
