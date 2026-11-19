import * as fc from 'fast-check';
import { type Arbitrary } from 'fast-check';
const arb: Arbitrary<number> = fc.integer();
