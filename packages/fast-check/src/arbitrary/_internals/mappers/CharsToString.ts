import { safeJoin, safeSplit } from '../../../utils/globals';

/** @internal */
export function charsToStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
export function charsToStringUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return safeSplit(value, '');
}
