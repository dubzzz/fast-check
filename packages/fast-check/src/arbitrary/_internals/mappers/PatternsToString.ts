import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { MaxLengthUpperBound } from '../helpers/MaxLengthFromMinLength';
import type { StringSharedConstraints } from '../../_shared/StringSharedConstraints';
import { safeJoin, Error } from '../../../utils/globals';
import { tokenizeString } from '../helpers/TokenizeString';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitrary */
export function patternsToStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
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
