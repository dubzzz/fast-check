import { describe, it, expect } from 'vitest';
import { nil } from '../../../../src/utils/iterator.js';
import * as fc from 'fast-check';

import { toss } from '../../../../src/check/runner/Tosser.js';
import type { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary.js';
import type { Property } from '../../../../src/check/property/types/Property.js';
import type { Random } from '../../../../src/random/generator/Random.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';

import * as stubArb from '../../stubs/arbitraries.js';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import type { QualifiedRandomGenerator } from '../../../../src/check/runner/configuration/QualifiedParameters.js';

const rngProducer = xorshift128plus as (seed: number) => QualifiedRandomGenerator;

const wrap = <T>(arb: Arbitrary<T>): Property<T> =>
  new (class implements Property<T> {
    constructor(readonly arb: Arbitrary<T>) {}
    generate = (rng: Random) => new Value(this.arb.generate(rng, undefined).value_, undefined);
    shrink = () => nil;
    runBeforeEach = () => {};
    run = () => ({ error: new Error('failure') });
    runAfterEach = () => {};
  })(arb);

describe('Tosser', () => {
  describe('toss', () => {
    it('Should offset the random number generator between calls', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(100), (seed, start) => {
          const s = toss(wrap(stubArb.forwardArray(4)), seed, rngProducer, []);
          const [g1, g2] = [
            ...s
              .drop(start)
              .take(2)
              .map((f) => f.value),
          ];
          expect(g1).not.toStrictEqual(g2);
          return true;
        }),
      ));
    it('Should produce the same sequence for the same seed', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(20), (seed, num) => {
          expect([
            ...toss(wrap(stubArb.forward()), seed, rngProducer, [])
              .take(num)
              .map((f) => f.value),
          ]).toStrictEqual([
            ...toss(wrap(stubArb.forward()), seed, rngProducer, [])
              .take(num)
              .map((f) => f.value),
          ]);
        }),
      ));
    it('Should not depend on the order of iteration', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(20), (seed, num) => {
          const onGoingItems1 = [...toss(wrap(stubArb.forward()), seed, rngProducer, []).take(num)];
          const onGoingItems2 = [...toss(wrap(stubArb.forward()), seed, rngProducer, []).take(num)];
          expect(
            onGoingItems2
              .reverse()
              .map((f) => f.value)
              .reverse(),
          ).toStrictEqual(onGoingItems1.map((f) => f.value));
        }),
      ));
    it('Should offset toss with the provided examples', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(20), fc.array(fc.integer()), (seed, num, examples) => {
          const noExamplesProvided = [...toss(wrap(stubArb.forward()), seed, rngProducer, []).take(num)].map(
            (f) => f.value,
          );
          const examplesProvided = [
            ...toss(wrap(stubArb.forward()), seed, rngProducer, examples).take(num + examples.length),
          ].map((f) => f.value);
          expect([...examples, ...noExamplesProvided]).toStrictEqual(examplesProvided);
        }),
      ));
  });
});
