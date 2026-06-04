import { safeSplice, safeSplit } from '../../../utils/globals.js';

/** @internal */
export function segmentsToPathMapper(segments: string[]): string {
  // Fused equivalent of `safeJoin(safeMap(segments, (v) => `/${v}`), '')`:
  // building the result in a single pass avoids allocating the intermediate
  // array of `/segment` strings (and the per-element arrow closure).
  let path = '';
  for (let index = 0; index !== segments.length; ++index) {
    path += '/' + segments[index];
  }
  return path;
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
