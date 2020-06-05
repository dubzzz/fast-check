import * as fc from '../../../lib/fast-check';

import { hash } from '../../../src/utils/hash';

describe('hash', () => {
  it('Should produce hash values in 0x00000000 and 0xffffffff', () =>
    fc.assert(
      fc.property(fc.fullUnicodeString(), (a) => {
        const h = hash(a);
        return h >= 0 && h <= 0xffffffff;
      })
    ));
  it('Should be able to compute hash even for invalid strings', () =>
    fc.assert(fc.property(fc.char16bits(), (a) => typeof hash(a) === 'number')));
});
