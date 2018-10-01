import * as fc from '../../../lib/fast-check';

import { stringify } from '../../../src/utils/stringify';

describe('stringify', () => {
  it('Should be able to stringify fc.anything()', () =>
    fc.assert(fc.property(fc.anything(), a => typeof stringify(a) === 'string')));
  it('Should be able to stringify fc.char16bits() (ie. possibly invalid strings)', () =>
    fc.assert(fc.property(fc.char16bits(), a => typeof stringify(a) === 'string')));
});
