import { safeSubstring } from '../../../utils/globals.js';

/** @internal */
export function paddedEightsToUuidMapper(t: [string, string, string, string]): string {
  return `${t[0]}-${safeSubstring(t[1], 4)}-${safeSubstring(t[1], 0, 4)}-${safeSubstring(t[2], 0, 4)}-${safeSubstring(
    t[2],
    4,
  )}${t[3]}`;
}

/** @internal */
const UuidRegex = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/;

/** @internal */
export function paddedEightsToUuidUnmapper(value: unknown): [string, string, string, string] {
  const v = value as string;
  const m = UuidRegex.exec(v);
  if (m === null) {
    throw new Error('Unsupported type');
  }
  return [m[1], m[3] + m[2], m[4] + safeSubstring(m[5], 0, 4), safeSubstring(m[5], 4)];
}
