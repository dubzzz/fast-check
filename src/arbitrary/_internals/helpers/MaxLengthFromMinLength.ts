/**
 * Compute `maxLength` based on `minLength`
 * @internal
 */
export function maxLengthFromMinLength(minLength: number): number {
  return Math.min(2 * minLength + 10, 0x7fffffff);
}
