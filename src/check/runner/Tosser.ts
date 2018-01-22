import Arbitrary from '../arbitrary/definition/Arbitrary'
import Shrinkable from '../arbitrary/definition/Shrinkable'
import { RandomGenerator, generate_n, skip_n } from '../../random/generator/RandomGenerator'
import MersenneTwister from '../../random/generator/MersenneTwister'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import IProperty from '../property/IProperty'

export default function* toss<Ts>(generator: (IProperty<Ts> | Arbitrary<Ts>), seed: number): IterableIterator<Shrinkable<Ts>> {
    let rng: RandomGenerator = MersenneTwister.from(seed);
    for (;;) {
        rng = skip_n(rng, 42);
        yield generator.generate(new MutableRandomGenerator(rng));
    }
}

export { toss };
