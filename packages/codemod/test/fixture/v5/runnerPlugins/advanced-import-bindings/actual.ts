import { assert as verify, property, integer } from 'fast-check';
import { strict as assert } from 'node:assert';

const fc = 1;
const prop = property(integer(), Number.isInteger);
verify(prop, { unbiased: true });
assert(fc);
function shadow(verify: (value: unknown, options: unknown) => void) {
  // This parameter shadows the fast-check import and may call a different runner.
  verify(prop, { unbiased: true });
}
