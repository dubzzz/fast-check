import { RandomGenerator } from '../generator/RandomGenerator'

export default class UniformDistribution {
    static inRange(from: number, to: number): (rng: RandomGenerator) => [number, RandomGenerator] {
        const diff = to - from +1;
        function helper(rng: RandomGenerator): [number, RandomGenerator] {
            const MIN_RNG = rng.min();
            const NUM_VALUES = rng.max() - rng.min() +1;
            const MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);

            let nrng = rng;
            let deltaV = MAX_ALLOWED;
            while (deltaV >= MAX_ALLOWED) {
                const [v, tmpRng] = nrng.next();
                nrng = tmpRng;
                deltaV = v - MIN_RNG;
            }
            return [deltaV % diff + from, nrng];
        }
        return helper;
    }
}

export { UniformDistribution };
