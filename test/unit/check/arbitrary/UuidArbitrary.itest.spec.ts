import { uuid } from '../../../../src/check/arbitrary/UuidArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';

describe('UuidArbitrary', () => {
  describe('uuid', () => {
    genericHelper.isValidArbitrary(() => uuid(), {
      isValidValue: (g: string) => /[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}/.test(g),
      isStrictlySmallerValue: (a, b) => a < b
    });
  });
});
