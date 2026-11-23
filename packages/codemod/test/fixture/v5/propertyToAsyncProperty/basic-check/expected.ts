import * as fc from 'fast-check';

const out = await fc.check(fc.asyncProperty(fc.nat(), () => true));
if (out.failed) {
  throw new Error('....');
}
