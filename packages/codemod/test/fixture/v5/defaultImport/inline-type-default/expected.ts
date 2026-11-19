import type * as fc from 'fast-check';
import { integer } from 'fast-check';
const arb: fc.Arbitrary<number> = integer();
