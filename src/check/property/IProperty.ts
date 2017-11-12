import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

export default interface IProperty<Ts> {
    run(mrng: MutableRandomGenerator): [boolean, Ts];
    runOne(v: Ts): boolean;
    shrink(v: Ts): Stream<Ts>;
}
