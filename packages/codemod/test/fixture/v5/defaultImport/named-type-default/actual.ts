import type { default as fc, Arbitrary } from 'fast-check';
type Arb = fc.Arbitrary<number> | Arbitrary<string>;
