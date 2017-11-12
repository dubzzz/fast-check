import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

export default abstract class Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): T;
    shrink(value: T): Stream<T> {
        return Stream.nil<T>();
    }
}

export { Arbitrary };
