import * as fc from 'fast-check';
import { it } from 'vitest';

it.each`
  isFlagEnabled
  ${true}
  ${false}
`('the name of the each test with $isFlagEnabled', async ({ isFlagEnabled }) => {
  await fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
});
