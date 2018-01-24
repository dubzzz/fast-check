import Arbitrary from './definition/Arbitrary'
import { integer } from './IntegerArbitrary'
import { tuple } from './TupleArbitrary'

function next(n: number): Arbitrary<number> {
    return integer(0, (1 << n) -1);
}

function float(): Arbitrary<number> {
    // uniformaly in the range 0 (inc.), 1 (exc.)
    return next(24).map(v => v / (1 << 24));
}

const doubleFactor = Math.pow(2, 27);
const doubleDivisor = Math.pow(2, -53);

function double(): Arbitrary<number> {
    // uniformaly in the range 0 (inc.), 1 (exc.)
    return tuple(next(26), next(27)).map(v => (v[0] * doubleFactor + v[1]) * doubleDivisor);
}

export { float, double };