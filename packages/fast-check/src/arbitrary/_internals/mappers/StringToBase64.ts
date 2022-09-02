import { safeSubstring } from '../../../utils/globals';

/** @internal - s is supposed to be composed of valid base64 values, not any '=' */
export function stringToBase64Mapper(s: string): string {
  switch (s.length % 4) {
    case 0:
      return s;
    case 3:
      return `${s}=`;
    case 2:
      return `${s}==`;
    default:
      return safeSubstring(s, 1); // remove one extra char to get to %4 == 0
  }
}

/** @internal */
export function stringToBase64Unmapper(value: unknown): string {
  if (typeof value !== 'string' || value.length % 4 !== 0) {
    throw new Error('Invalid string received');
  }
  const lastTrailingIndex = value.indexOf('=');
  if (lastTrailingIndex === -1) {
    return value; // no trailing "="
  }
  const numTrailings = value.length - lastTrailingIndex;
  if (numTrailings > 2) {
    throw new Error('Cannot unmap the passed value');
  }
  return safeSubstring(value, 0, lastTrailingIndex);
}
