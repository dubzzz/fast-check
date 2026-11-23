import * as fc from 'fast-check';
import { it } from 'vitest';

it.each([{ isFlagEnabled: true }, { isFlagEnabled: false }])(
  'the name of the each test with $isFlagEnabled',
  ({ isFlagEnabled }) => {
    fc.assert(fc.property(fc.nat(), (n) => true));
  },
);
