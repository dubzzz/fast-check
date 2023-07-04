import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { tuple } from './tuple';
import { integer } from './integer';
import { paddedUintToBase32StringMapper, uintToBase32StringUnmapper } from './_internals/mappers/UintToBase32String';

/**
 * For ulid
 *
 * According to {@link https://github.com/ulid/spec | ulid spec}
 *
 * No mixed case, only upper case digits (0-9A-Z except for: I,L,O,U)
 *
 * @remarks Since 3.11.0
 * @public
 */
export function ulid(): Arbitrary<string> {
  const timestampPartArbitrary = integer({ min: 0, max: 0xffffffffffff }); // 48 bits
  // Numeric literals with absolute values equal to 2^53 or greater are too large to be represented accurately as integers.
  // Therefore we split the 80 bit randomness part into two integers of 40 bits length each.
  const randomnessPartOneArbitrary = integer({ min: 0, max: 0xffffffffff }); // 40 bits
  const randomnessPartTwoArbitrary = integer({ min: 0, max: 0xffffffffff }); // 40 bits

  return tuple(timestampPartArbitrary, randomnessPartOneArbitrary, randomnessPartTwoArbitrary).map(
    ([date, random1, random2]) => {
      return [
        paddedUintToBase32StringMapper(10)(date), // 10 chars of base32 -> 48 bits
        paddedUintToBase32StringMapper(8)(random1), // 8 chars of base32 -> 40 bits
        paddedUintToBase32StringMapper(8)(random2),
      ].join('');
    },
    (value) => {
      if (typeof value !== 'string' || value.length !== 26) {
        throw new Error('Unsupported type');
      }

      return [value.slice(0, 10), value.slice(10, 18), value.slice(18)].map(uintToBase32StringUnmapper) as [
        number,
        number,
        number
      ];
    }
  );
}
