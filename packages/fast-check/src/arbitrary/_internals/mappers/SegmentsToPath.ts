import { safeJoin, safeMap, safeSplice, safeSplit } from '../../../utils/globals.js';

/** @internal */
export function segmentsToPathMapper(segments: string[]): string {
  return safeJoin(
    safeMap(segments, (v) => `/${v}`),
    '',
  );
}

/** @internal */
export function segmentsToPathUnmapper(value: unknown): string[] {
  const v = value as string;
  if (v.length !== 0 && v[0] !== '/') {
    throw new Error('Incompatible value received: start');
  }
  return safeSplice(safeSplit(v, '/'), 1);
}
