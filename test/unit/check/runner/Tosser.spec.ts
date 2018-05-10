import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import { toss } from '../../../../src/check/runner/Tosser';
import { stream } from '../../../../src/stream/Stream';

import * as stubArb from '../../stubs/arbitraries';

describe('Tosser', () => {
  describe('toss', () => {
    it('Should offset the random number generator between calls', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(100), (seed, start) => {
          const s = stream(toss(stubArb.forwardArray(4), seed));
          const [g1, g2] = [
            ...s
              .drop(start)
              .take(2)
              .map(f => f().value)
          ];
          assert.notDeepStrictEqual(g1, g2);
          return true;
        })
      ));
    it('Should produce the same sequence for the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          assert.deepStrictEqual(
            [
              ...stream(toss(stubArb.forward(), seed))
                .take(num)
                .map(f => f().value)
            ],
            [
              ...stream(toss(stubArb.forward(), seed))
                .take(num)
                .map(f => f().value)
            ]
          );
        })
      ));
    it('Should not depend on the order of iteration', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          const onGoingItems1 = [...stream(toss(stubArb.forward(), seed)).take(num)];
          const onGoingItems2 = [...stream(toss(stubArb.forward(), seed)).take(num)];
          assert.deepStrictEqual(
            onGoingItems2
              .reverse()
              .map(f => f().value)
              .reverse(),
            onGoingItems1.map(f => f().value)
          );
        })
      ));
  });
});
