import MutableRandomGenerator from '../../../random/generator/MutableRandomGenerator'
import Shrinkable from './Shrinkable'
import Stream from '../../../stream/Stream'

export default abstract class Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): Shrinkable<T>;
}

abstract class ArbitraryWithShrink<T> extends Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): Shrinkable<T>;
    abstract shrink(value: T): Stream<T>;
    shrinkableFor(value: T): Shrinkable<T> {
        return new Shrinkable(value, () => this.shrink(value).map(v => this.shrinkableFor(v)));
    }
}

export { Arbitrary, ArbitraryWithShrink };
