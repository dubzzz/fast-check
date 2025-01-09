import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { toss } from '../../../../src/check/runner/Tosser';
import { Stream, stream } from '../../../../src/stream/Stream';
import type { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty';
import type { Random } from '../../../../src/random/generator/Random';
import { Value } from '../../../../src/check/arbitrary/definition/Value';

import * as stubArb from '../../stubs/arbitraries';
import prand from 'pure-rand';
import type { QualifiedRandomGenerator } from '../../../../src/check/runner/configuration/QualifiedParameters';

const rngProducer = prand.xorshift128plus as (seed: number) => QualifiedRandomGenerator;

const wrap = <T>(arb: Arbitrary<T>): IRawProperty<T> =>
  new (class implements IRawProperty<T> {
    constructor(readonly arb: Arbitrary<T>) {}
    isAsync = () => false;
    generate = (rng: Random) => new Value(this.arb.generate(rng, undefined).value_, undefined);
    shrink = () => Stream.nil<Value<T>>();
    runBeforeEach = () => {};
    run = () => ({ error: new Error('failure') });
    runAfterEach = () => {};
  })(arb);

describe('Tosser', () => {
  describe('toss', () => {
    it('Should offset the random number generator between calls', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(100), (seed, start) => {
          const s = stream(toss(wrap(stubArb.forwardArray(4)), seed, rngProducer, []));
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
    it('Should produce the same sequence for the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          expect([
            ...stream(toss(wrap(stubArb.forward()), seed, rngProducer, []))
              .take(num)
              .map((f) => f.value),
          ]).toStrictEqual([
            ...stream(toss(wrap(stubArb.forward()), seed, rngProducer, []))
              .take(num)
              .map((f) => f.value),
          ]);
        }),
      ));
    it('Should not depend on the order of iteration', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          const onGoingItems1 = [...stream(toss(wrap(stubArb.forward()), seed, rngProducer, [])).take(num)];
          const onGoingItems2 = [...stream(toss(wrap(stubArb.forward()), seed, rngProducer, [])).take(num)];
          expect(
            onGoingItems2
              .reverse()
              .map((f) => f.value)
              .reverse(),
          ).toStrictEqual(onGoingItems1.map((f) => f.value));
        }),
      ));
    it('Should offset toss with the provided examples', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), fc.array(fc.integer()), (seed, num, examples) => {
          const noExamplesProvided = [
            ...stream(toss(wrap(stubArb.forward()), seed, rngProducer, [])).take(num - examples.length),
          ].map((f) => f.value);
          const examplesProvided = [
            ...stream(toss(wrap(stubArb.forward()), seed, rngProducer, examples)).take(num),
          ].map((f) => f.value);
          expect([...examples, ...noExamplesProvided].slice(0, num)).toStrictEqual(examplesProvided);
        }),
      ));
  });
});
