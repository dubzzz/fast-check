import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';
import {
  dummy,
  assertNotSuggestInputInShrink,
  assertSameTupleForSameSeed,
  assertShrinkInRange
} from './TupleArbitrary.properties';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { char } from '../../../../src/check/arbitrary/CharacterArbitrary';
import { genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

describe('TupleArbitrary', () => {
  describe('genericTuple', () => {
    it('Should generate the same tuple with the same random', () => assertSameTupleForSameSeed([dummy(42), dummy(8)]));
    it('Should shrink tuple within allowed values', () => assertShrinkInRange([dummy(42), dummy(8)]));
    it('Should not suggest input in tuple shrinked values', () => assertNotSuggestInputInShrink([dummy(42), dummy(8)]));
    it('Should throw on null arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), (null as any) as Arbitrary<string>])));
    it('Should throw on invalid arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), <Arbitrary<any>>{}])));
    genericHelper.testNoImpactOfMutation(genericTuple([char(), char()]), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = '.';
    });
  });
});
