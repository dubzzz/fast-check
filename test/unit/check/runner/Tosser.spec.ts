import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import { toss } from '../../../../src/check/runner/Tosser';
import { stream } from '../../../../src/stream/Stream';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { IProperty } from '../../../../src/check/property/IProperty';
import { Random } from '../../../../src/random/generator/Random';
import { RandomType } from '../../../../src/check/runner/configuration/RandomType';

import * as stubArb from '../../stubs/arbitraries';

const wrap = <T>(arb: Arbitrary<T>): IProperty<T> =>
  new class implements IProperty<T> {
    constructor(readonly arb: Arbitrary<T>) {}
    isAsync = () => false;
    generate = (rng: Random) => this.arb.generate(rng);
    run = () => '';
  }(arb);

const randomTypeArb = fc.constantFrom('mersenne', 'congruential', 'congruential32') as fc.Arbitrary<RandomType>;

describe('Tosser', () => {
  describe('toss', () => {
    it('Should offset the random number generator between calls', () =>
      fc.assert(
        fc.property(fc.integer(), randomTypeArb, fc.nat(100), (seed, randomType, start) => {
          const s = stream(toss(wrap(stubArb.forwardArray(4)), seed, randomType, []));
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
        fc.property(fc.integer(), randomTypeArb, fc.nat(20), (seed, randomType, num) => {
          assert.deepStrictEqual(
            [
              ...stream(toss(wrap(stubArb.forward()), seed, randomType, []))
                .take(num)
                .map(f => f().value)
            ],
            [
              ...stream(toss(wrap(stubArb.forward()), seed, randomType, []))
                .take(num)
                .map(f => f().value)
            ]
          );
        })
      ));
    it('Should not depend on the order of iteration', () =>
      fc.assert(
        fc.property(fc.integer(), randomTypeArb, fc.nat(20), (seed, randomType, num) => {
          const onGoingItems1 = [...stream(toss(wrap(stubArb.forward()), seed, randomType, [])).take(num)];
          const onGoingItems2 = [...stream(toss(wrap(stubArb.forward()), seed, randomType, [])).take(num)];
          assert.deepStrictEqual(
            onGoingItems2
              .reverse()
              .map(f => f().value)
              .reverse(),
            onGoingItems1.map(f => f().value)
          );
        })
      ));
    it('Should offset toss with the provided examples', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          randomTypeArb,
          fc.nat(20),
          fc.array(fc.integer()),
          (seed, randomType, num, examples) => {
            const noExamplesProvided = [
              ...stream(toss(wrap(stubArb.forward()), seed, randomType, [])).take(num - examples.length)
            ].map(f => f().value);
            const examplesProvided = [
              ...stream(toss(wrap(stubArb.forward()), seed, randomType, examples)).take(num)
            ].map(f => f().value);
            assert.deepStrictEqual([...examples, ...noExamplesProvided].slice(0, num), examplesProvided);
          }
        )
      ));
    it('Should throw on invalid random', () => {
      assert.throws(() => {
        const data = toss(wrap(stubArb.forward()), 0, 'invalid' as any, []);
        [...stream(data).take(1)];
      });
    });
  });
});
