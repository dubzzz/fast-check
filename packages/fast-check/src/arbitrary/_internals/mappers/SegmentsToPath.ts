import { safeJoin, safeMap, safeSplice, safeSplit } from '../../../utils/globals';

/** @internal */
export function segmentsToPathMapper(segments: string[]): string {
  return safeJoin(
    safeMap(segments, (v) => `/${v}`),
    ''
  );
}

/** @internal */
export function segmentsToPathUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Incompatible value received: type');
  }
  if (value.length !== 0 && value[0] !== '/') {
    throw new Error('Incompatible value received: start');
  }
  return safeSplice(safeSplit(value, '/'), 1);
}
