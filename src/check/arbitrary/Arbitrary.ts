import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

export default interface Arbitrary<T> {
    generate(mrng: MutableRandomGenerator): T;
}

export { Arbitrary };
