import Shrinkable from '../arbitrary/definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

export default interface IProperty<Ts> {
    run(mrng: MutableRandomGenerator): [boolean, Shrinkable<Ts>];
    runOne(v: Ts): boolean;
}
