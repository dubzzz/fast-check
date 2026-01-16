import { safeJoin, safeSplit } from '../../../utils/globals.js';

/** @internal */
export function charsToStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
export function charsToStringUnmapper(value: unknown): string[] {
  return safeSplit(value as string, '');
}
