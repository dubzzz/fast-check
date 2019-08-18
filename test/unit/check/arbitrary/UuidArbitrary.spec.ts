import { uuid, uuidExtended } from '../../../../src/check/arbitrary/UuidArbitrary';
import * as genericHelper from './generic/GenericArbitraryHelper';

describe('UuidArbitrary', () => {
  describe('uuid', () => {
    genericHelper.isValidArbitrary(() => uuid(), {
      isValidValue: (g: string) => /[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}/.test(g),
      isStrictlySmallerValue: (a, b) => a < b
    });
  });
  describe('uuidExtended', () => {
    genericHelper.isValidArbitrary(() => uuidExtended(), {
      isValidValue: (g: string) =>
        /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/.test(g),
      isStrictlySmallerValue: (a, b) => {
        const ra = a.toLowerCase();
        const rb = b.toLowerCase();
        if (ra !== rb) {
          return ra < rb;
        }
        // we should have less upper case letters in a than b
        // and upper case letters in a should be in b
        const isUpperHex = (l: string) => l >= 'A' && l <= 'F';
        const lettersA = a.split('');
        const lettersB = b.split('');
        return (
          lettersA.filter(isUpperHex).length < lettersB.filter(isUpperHex).length &&
          lettersA.every((l, idx) => {
            if (isUpperHex(a[idx]) && isUpperHex(b[idx])) return true;
            if (!isUpperHex(a[idx])) return true;
            return false;
          })
        );
      }
    });
  });
});
