import { assert } from 'console';
import fc from 'fast-check';
import {
  RelativeSize,
  Size,
  SizeForArbitrary,
} from '../../../../src/arbitrary/_internals/helpers/MaxLengthFromMinLength';

const allSizeOrdered = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
export const sizeArb = fc.constantFrom<Size>(...allSizeOrdered);
export const isSmallerSize = (sa: Size, sb: Size): boolean => allSizeOrdered.indexOf(sa) < allSizeOrdered.indexOf(sb);

const allRelativeSize = ['-4', '-3', '-2', '-1', '=', '+1', '+2', '+3', '+4'] as const;
export const relativeSizeArb = fc.constantFrom<RelativeSize>(...allRelativeSize);

const allSizeForArbitrary = [...allSizeOrdered, ...allRelativeSize, 'max'] as const; // WARNING: it does not include undefined
export const sizeForArbitraryArb = fc.constantFrom<SizeForArbitrary>(...allSizeForArbitrary);

export const sizeRelatedGlobalConfigArb = fc.record(
  { baseSize: sizeArb, defaultSizeToMaxWhenMaxSpecified: fc.boolean() },
  { requiredKeys: [] }
);

// Type check that helpers are covering all the possibilities

const failIfMissingSize: Size extends typeof allSizeOrdered[number] ? true : never = true;
const failIfMissingRelativeSize: RelativeSize extends typeof allRelativeSize[number] ? true : never = true;
const failIfMissingSizeForArbitrary: NonNullable<SizeForArbitrary> extends typeof allSizeForArbitrary[number]
  ? true
  : never = true;
assert(failIfMissingSize); // just not to appear unused
assert(failIfMissingRelativeSize); // just not to appear unused
assert(failIfMissingSizeForArbitrary); // just not to appear unused
