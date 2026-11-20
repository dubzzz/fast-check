import { assert as verify, property, integer } from 'fast-check';
import * as fc2 from 'fast-check';
import { strict as assert } from 'node:assert';

const fc = 1;
const prop = property(integer(), Number.isInteger);
verify(prop, { plugins: [fc2.unbiased()] });
assert(fc);
function shadow(verify: (value: unknown, options: unknown) => void) {
  verify(prop, { unbiased: true });
}
