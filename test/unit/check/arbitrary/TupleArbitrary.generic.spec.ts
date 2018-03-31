import fc from '../../../../lib/fast-check';
import {
  dummy,
  propertyNotSuggestInputInShrink,
  propertySameTupleForSameSeed,
  propertyShrinkInRange
} from './TupleArbitrary.properties';

describe('TupleArbitrary', () => {
  describe('generic_tuple', () => {
    it('Should generate the same tuple with the same random', () =>
      fc.assert(propertySameTupleForSameSeed([dummy(42), dummy(8)], true)));
    it('Should shrink tuple within allowed values', () =>
      fc.assert(propertyShrinkInRange([dummy(42), dummy(8)], true)));
    it('Should not suggest input in tuple shrinked values', () =>
      fc.assert(propertyNotSuggestInputInShrink([dummy(42), dummy(8)], true)));
  });
});
