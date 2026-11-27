import * as fc from 'fast-check';

const out = fc.check(property);
function consume(out) {
  return out.failed;
}
