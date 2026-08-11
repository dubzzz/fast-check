import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { MaxLengthUpperBound } from '../helpers/MaxLengthFromMinLength.js';
import type { StringSharedConstraints } from '../../_shared/StringSharedConstraints.js';
import { tokenizeString } from '../helpers/TokenizeString.js';

/** tab is supposed to be composed of valid entries extracted from the source arbitrary */
export function patternsToStringMapper(tab: string[]): string {
  return tab.join('');
}

function minLengthFrom(constraints: StringSharedConstraints): number {
  return constraints.minLength !== undefined ? constraints.minLength : 0;
}

function maxLengthFrom(constraints: StringSharedConstraints): number {
  return constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
}

export function patternsToStringUnmapperIsValidLength(tokens: string[], constraints: StringSharedConstraints): boolean {
  return minLengthFrom(constraints) <= tokens.length && tokens.length <= maxLengthFrom(constraints);
}

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
