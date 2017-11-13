import { check, assert } from './property/Runner'
import { property } from './property/Property'

import Arbitrary from './arbitrary/Arbitrary'
import { array } from './arbitrary/ArrayArbitrary'
import { integer, nat } from './arbitrary/IntegerArbitrary'
import { tuple } from './arbitrary/TupleArbitrary'

export {
    check, assert,
    property,
    Arbitrary, array, integer, nat, tuple
};
