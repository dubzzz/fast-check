import * as fc from '../../../../lib/fast-check';

import { ReplayPath } from '../../../../src/check/model/ReplayPath';

const biasedBoolean = fc.frequency(
  { weight: 1000, arbitrary: fc.constant(true) },
  { weight: 1, arbitrary: fc.constant(false) }
);

describe('ReplayPath', () => {
  it('Should be able to read back itself', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean(), 0, 1000), (replayPath: boolean[]) => {
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
  it('Should be able to read back itself (biased boolean)', () =>
    fc.assert(
      fc.property(fc.array(biasedBoolean, 0, 1000), (replayPath: boolean[]) => {
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
});
