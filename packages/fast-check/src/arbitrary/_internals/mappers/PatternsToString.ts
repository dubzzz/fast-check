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
export function patternsToStringUnmapperIsValidLength(tokens: string[], constraints: StringSharedConstraints) {
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
  return minLength <= tokens.length && tokens.length <= maxLength;
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

    const tokens = tokenizeString(patternsArb, value);
    if (tokens !== undefined && patternsToStringUnmapperIsValidLength(tokens, constraints)) {
      return tokens;
    }
    throw new Error('Unable to unmap received string');
  };
}
