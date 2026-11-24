import * as fc from 'fast-check';
import { it } from 'vitest';

it.skip('the name of the skipped test', async () => {
  await fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
});
