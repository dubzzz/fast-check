import { type default as fc, integer } from 'fast-check';
const arb: fc.Arbitrary<number> = integer();
