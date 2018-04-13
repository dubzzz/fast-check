import fc from '../../../../lib/fast-check';
import {
  dummy,
  propertyNotSuggestInputInShrink,
  propertySameTupleForSameSeed,
  propertyShrinkInRange
} from './TupleArbitrary.properties';

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
    genericHelper.testNoImpactOfMutation(genericTuple([char(), char()]), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = '.';
    });
  });
});
