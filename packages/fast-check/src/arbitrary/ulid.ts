import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { tuple } from './tuple.js';
import { integer } from './integer.js';
import { paddedUintToBase32StringMapper, uintToBase32StringUnmapper } from './_internals/mappers/UintToBase32String.js';

const padded10Mapper = paddedUintToBase32StringMapper(10);
const padded8Mapper = paddedUintToBase32StringMapper(8);

type MapperIn = [number, number, number];
type MapperOut = string;

function ulidMapper(parts: MapperIn): MapperOut {
  return (
    padded10Mapper(parts[0]) + // 10 chars of base32 -> 48 bits
    padded8Mapper(parts[1]) + // 8 chars of base32 -> 40 bits
    padded8Mapper(parts[2])
  );
}

function ulidUnmapper(value: unknown): MapperIn {
  const v = value as string;
  if (v.length !== 26) {
    throw new Error('Unsupported type');
  }
  return [
    uintToBase32StringUnmapper(v.slice(0, 10)),
    uintToBase32StringUnmapper(value.slice(10, 18)),
    uintToBase32StringUnmapper(value.slice(18)),
  ];
}

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
    ulidMapper,
    ulidUnmapper,
  );
}
