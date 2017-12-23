import MutableRandomGenerator from '../../../random/generator/MutableRandomGenerator'
import Shrinkable from './Shrinkable'

export default abstract class Arbitrary<T> {
    abstract generate(mrng: MutableRandomGenerator): Shrinkable<T>;
}

export { Arbitrary };
