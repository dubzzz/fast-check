import * as fc from 'fast-check';
import { it } from 'vitest';

it('the name of the test', async () => {
  await fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
});
