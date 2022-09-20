import { safeJoin } from '../../../utils/globals';

/** @internal - tab is supposed to be composed of valid code-points, not halved surrogate pairs */
export function codePointsToStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
export function codePointsToStringUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return [...value];
}
