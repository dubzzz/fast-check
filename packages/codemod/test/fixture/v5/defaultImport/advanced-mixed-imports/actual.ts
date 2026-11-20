import fc, { integer as int, type Arbitrary } from 'fast-check';
const arb: Arbitrary<number> = int();
fc.sample(arb);
