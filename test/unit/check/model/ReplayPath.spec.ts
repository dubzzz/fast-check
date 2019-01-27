import * as fc from '../../../../lib/fast-check';

import { ReplayPath } from '../../../../src/check/model/ReplayPath';

describe('ReplayPath', () => {
  it('Should be able to read back itself', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean(), 0, 1000), (replayPath: boolean[]) => {
        expect(ReplayPath.parse(ReplayPath.stringify(replayPath))).toEqual(replayPath);
      })
    ));
});
