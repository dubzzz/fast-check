import * as fc from 'fast-check';
import { it } from 'vitest';

it('the name of the test', () => {
  fc.assert(fc.property(fc.nat(), (n) => true));
});
