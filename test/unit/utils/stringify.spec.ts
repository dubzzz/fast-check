import * as fc from '../../../lib/fast-check';

import { stringify } from '../../../src/utils/stringify';

declare function BigInt(n: number | bigint | string): bigint;

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(), a => typeof stringify(a) === 'string')));
  it('Should be able to stringify fc.char16bits() (ie. possibly invalid strings)', () =>
    fc.assert(fc.property(fc.char16bits(), a => typeof stringify(a) === 'string')));
  if (typeof BigInt !== 'undefined') {
    it('Should be able to stringify bigint in object correctly', () =>
      fc.assert(fc.property(fc.bigInt(), b => stringify({ b }) === '{"b":"' + b + 'n"}')));
  }
});
