import Shrinkable from '../arbitrary/definition/Shrinkable'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

export default interface IProperty<Ts> {
    isAsync(): boolean;
    generate(mrng: MutableRandomGenerator): Shrinkable<Ts>;
    run(v: Ts): Promise<string|null> | (string|null);
}
