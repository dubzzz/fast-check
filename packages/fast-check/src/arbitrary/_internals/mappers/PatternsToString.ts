import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { MaxLengthUpperBound } from '../helpers/MaxLengthFromMinLength.js';
import type { StringSharedConstraints } from '../../_shared/StringSharedConstraints.js';
import { Error } from '../../../utils/globals.js';
import { tokenizeString } from '../helpers/TokenizeString.js';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitrary */
export function patternsToStringMapper(tab: string[]): string {
  // `tab` is always a genuine Array built internally by the source arbitrary,
  // so a direct indexed concatenation is safe (no exposure to poisoned prototypes)
  // and avoids the per-call overhead of Array.prototype.join.
  let out = '';
  for (let index = 0; index !== tab.length; ++index) {
    out += tab[index];
  }
  return out;
}

/** @internal */
function minLengthFrom(constraints: StringSharedConstraints): number {
  return constraints.minLength !== undefined ? constraints.minLength : 0;
}

/** @internal */
function maxLengthFrom(constraints: StringSharedConstraints): number {
  return constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
}

/** @internal */
export function patternsToStringUnmapperIsValidLength(tokens: string[], constraints: StringSharedConstraints): boolean {
  return minLengthFrom(constraints) <= tokens.length && tokens.length <= maxLengthFrom(constraints);
}

/** @internal */
export function patternsToStringUnmapperFor(
  patternsArb: Arbitrary<string>,
  constraints: StringSharedConstraints,
): (value: unknown) => string[] {
  return function patternsToStringUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported value');
    }

    const tokens = tokenizeString(patternsArb, value, minLengthFrom(constraints), maxLengthFrom(constraints));
    if (tokens === undefined) {
      throw new Error('Unable to unmap received string');
    }
    return tokens;
  };
}
