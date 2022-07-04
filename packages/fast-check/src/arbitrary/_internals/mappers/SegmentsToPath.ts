/** @internal */
export function segmentsToPathMapper(segments: string[]): string {
  return segments.map((v) => `/${v}`).join('');
}

/** @internal */
export function segmentsToPathUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Incompatible value received: type');
  }
  if (value.length !== 0 && value[0] !== '/') {
    throw new Error('Incompatible value received: start');
  }
  return value.split('/').splice(1);
}
