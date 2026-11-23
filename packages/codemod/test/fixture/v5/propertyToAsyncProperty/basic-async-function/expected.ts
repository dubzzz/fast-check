import * as fc from 'fast-check';

async function abc() {
  await fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
}
