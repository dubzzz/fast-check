import * as fc from 'fast-check';
import { it } from 'vitest';

it.skip('the name of the skipped test', () => {
  fc.assert(fc.property(fc.nat(), (n) => true));
});
