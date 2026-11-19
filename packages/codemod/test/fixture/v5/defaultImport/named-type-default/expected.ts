import type * as fc from 'fast-check';
import type { Arbitrary } from 'fast-check';
type Arb = fc.Arbitrary<number> | Arbitrary<string>;
