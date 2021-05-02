import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { integer } from '../../integer';

/** @internal */
export function charToCode(c: unknown): number {
  if (typeof c !== 'string') {
    throw new Error('Cannot unmap non-string');
  }
  if (c.length === 0 || c.length > 2) {
    throw new Error('Cannot unmap string with more or less than one character');
  }

  const c1 = c.charCodeAt(0);
  if (c.length === 1) {
    return c1; // partial surrogate is ok
  }

  const c2 = c.charCodeAt(1);
  if (c1 < 0xd800 || c1 > 0xdbff || c2 < 0xdc00 || c2 > 0xdfff) {
    throw new Error('Cannot unmap invalid surrogate pairs');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return c.codePointAt(0)!;
}

/** @internal */
export function buildCharacterArbitrary(
  min: number,
  max: number,
  mapToCode: (v: number) => number,
  unmapFromCode: (v: number) => number
): Arbitrary<string> {
  return convertFromNext(
    convertToNext(integer(min, max)).map(
      (n) => String.fromCodePoint(mapToCode(n)),
      (c) => unmapFromCode(charToCode(c))
    )
  );
}
