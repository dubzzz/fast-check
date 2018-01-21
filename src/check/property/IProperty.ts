import Shrinkable from '../arbitrary/definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

export default interface IProperty<Ts> {
    generate(mrng: MutableRandomGenerator): Shrinkable<Ts>;
    run(v: Ts): (string|null);
}
