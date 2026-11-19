// Keep the import explanation.
import fc, {
  // Keep the named binding explanation.
  integer as int,
  type Arbitrary,
} from 'fast-check';
const arb: Arbitrary<number> = int();
fc.sample(arb);
