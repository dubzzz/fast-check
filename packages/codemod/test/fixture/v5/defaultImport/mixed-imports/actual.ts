import fc, { assert, integer as int, type Arbitrary } from 'fast-check';
const arb: Arbitrary<number> = int();
assert(fc.property(arb, (n) => n === n));
