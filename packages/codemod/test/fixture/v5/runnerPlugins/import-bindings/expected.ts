import { assert as verify, check } from 'fast-check';
import * as fc2 from 'fast-check';
import { assert } from 'other-library';
const fc = unrelated;
verify(prop, { plugins: [fc2.timeout(100)] });
check(prop);
assert(prop, { timeout: 50 });
function shadow(verify) {
  verify(prop, { timeout: 50 });
}
