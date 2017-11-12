import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

export default interface IProperty<Ts> {
    run(mrng: MutableRandomGenerator): boolean;
}
