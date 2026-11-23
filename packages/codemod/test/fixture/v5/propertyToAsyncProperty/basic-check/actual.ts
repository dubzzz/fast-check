import * as fc from 'fast-check';

const out = fc.check(fc.property(fc.nat(), () => true));
if (out.failed) {
  throw new Error('....');
}
