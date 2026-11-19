// Keep the import explanation.
import * as fc from 'fast-check';
import {
// Keep the named binding explanation.
integer as int, type Arbitrary
} from 'fast-check';
const arb: Arbitrary<number> = int();
fc.sample(arb);
