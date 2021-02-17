import { uuid, uuidV } from '../../../../src/check/arbitrary/UuidArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';
import fc from '../../../../lib/fast-check';

describe('UuidArbitrary', () => {
  describe('uuid', () => {
    genericHelper.isValidArbitrary(() => uuid(), {
      isValidValue: (g: string) => /[0-9a-f]{8}-[0-9a-f]{4}-[12345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/.test(g),
      isStrictlySmallerValue: (a, b) => a !== b,
    });
  });
  describe('uuidV', () => {
    genericHelper.isValidArbitrary((constraint: 1 | 2 | 3 | 4 | 5) => uuidV(constraint), {
      seedGenerator: fc.constantFrom(...([1, 2, 3, 4, 5] as const)),
      isValidValue: (g: string, constraint: 1 | 2 | 3 | 4 | 5) =>
        /[0-9a-f]{8}-[0-9a-f]{4}-[12345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/.test(g) &&
        g[14] === String(constraint),
      isStrictlySmallerValue: (a, b) => a !== b,
    });
  });
});
