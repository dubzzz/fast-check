import * as fc from 'fast-check';

import { ReplayPath } from '../../../../src/check/model/ReplayPath';

const biasedBoolean = fc.oneof(
  { weight: 1000, arbitrary: fc.constant(true) },
  { weight: 1, arbitrary: fc.constant(false) }
);

describe('ReplayPath', () => {
  it('Should be able to read back itself', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean(), { maxLength: 1000 }), (replayPath: boolean[]) => {
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
  it('Should be able to read back itself (biased boolean)', () =>
    fc.assert(
      fc.property(fc.array(biasedBoolean, { maxLength: 1000 }), (replayPath: boolean[]) => {
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
  it('Should be able to read back itself when all elements of replayPath are equal', () =>
    fc.assert(
      fc.property(fc.nat(10000), fc.boolean(), (n, v) => {
        const replayPath = Array(n).fill(v);
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
});
