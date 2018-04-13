import * as assert from 'assert';
import fc from '../../../../lib/fast-check';
import {
  dummy,
  propertyNotSuggestInputInShrink,
  propertySameTupleForSameSeed,
  propertyShrinkInRange
} from './TupleArbitrary.properties';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { char } from '../../../../src/check/arbitrary/CharacterArbitrary';
import { genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

describe('TupleArbitrary', () => {
  describe('genericTuple', () => {
    it('Should generate the same tuple with the same random', () =>
      fc.assert(propertySameTupleForSameSeed([dummy(42), dummy(8)], true)));
    it('Should shrink tuple within allowed values', () =>
      fc.assert(propertyShrinkInRange([dummy(42), dummy(8)], true)));
    it('Should not suggest input in tuple shrinked values', () =>
      fc.assert(propertyNotSuggestInputInShrink([dummy(42), dummy(8)], true)));
    it('Should throw on null arbitrary', () => assert.throws(() => genericTuple([dummy(1), dummy(2), null])));
    it('Should throw on invalid arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), <Arbitrary<any>>{}])));
    genericHelper.testNoImpactOfMutation(genericTuple([char(), char()]), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = '.';
    });
  });
});
