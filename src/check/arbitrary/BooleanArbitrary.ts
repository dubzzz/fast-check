import Arbitrary from './definition/Arbitrary'
import { integer } from './IntegerArbitrary'

function boolean(): Arbitrary<boolean> {
    return integer(0, 1).map(v => v == 1);
}

export { boolean };