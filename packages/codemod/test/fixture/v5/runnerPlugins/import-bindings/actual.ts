import { assert as verify, check } from 'fast-check';
import { assert } from 'other-library';
const fc = unrelated;
verify(prop, { timeout: 100 });
check(prop, { unbiased: false });
assert(prop, { timeout: 50 });
function shadow(verify) {
  verify(prop, { timeout: 50 });
}
