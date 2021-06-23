/** @internal */
export function numberToPaddedEightMapper(n: number): string {
  return n.toString(16).padStart(8, '0');
}

/** @internal */
export function numberToPaddedEightUnmapper(value: unknown): number {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }
  const n = parseInt(value, 16);
  if (value !== numberToPaddedEightMapper(n)) {
    throw new Error('Unsupported value');
  }
  return n;
}
