import { RandomGenerator } from '../generator/RandomGenerator'

export default class UniformDistribution {
    static inRange(from: number, to: number): (rng: RandomGenerator) => [number, RandomGenerator] {
        const diff = to - from +1;
        function helper(rng: RandomGenerator): [number, RandomGenerator] {
            const NUM_VALUES = rng.max() - rng.min() +1;
            const MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);
            
            let prng = rng;
            while (true) {
                const [v, nrng] = prng.next();
                const deltaV = v - prng.min();
                if (deltaV < MAX_ALLOWED) {
                    return [deltaV % diff + from, nrng];
                }
                prng = nrng;
            }
        }
        return helper;
    }
}

export { UniformDistribution };
