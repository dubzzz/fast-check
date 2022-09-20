import { safeEndsWith, safeJoin, safeSlice, safeSplit, safeStartsWith, safeSubstring } from '../../../utils/globals';

/** @internal */
function readBh(value: string): string[] {
  if (value.length === 0) return [];
  else return safeSplit(value, ':');
}

/** @internal */
function extractEhAndL(value: string): [string[], string] {
  const valueSplits = safeSplit(value, ':');
  if (valueSplits.length >= 2 && valueSplits[valueSplits.length - 1].length <= 4) {
    // valueSplits[valueSplits.length - 1] is a h16
    // so we need to take the two last entries for l
    return [
      safeSlice(valueSplits, 0, valueSplits.length - 2),
      `${valueSplits[valueSplits.length - 2]}:${valueSplits[valueSplits.length - 1]}`,
    ];
  }
  return [safeSlice(valueSplits, 0, valueSplits.length - 1), valueSplits[valueSplits.length - 1]];
}

/** @internal */
export function fullySpecifiedMapper(data: [/*eh*/ string[], /*l*/ string]): string {
  return `${safeJoin(data[0], ':')}:${data[1]}`;
}
/** @internal */
export function fullySpecifiedUnmapper(value: unknown): [string[], string] {
  // Shape:
  // >  6( h16 ":" ) ls32
  if (typeof value !== 'string') throw new Error('Invalid type');
  return extractEhAndL(value);
}

/** @internal */
export function onlyTrailingMapper(data: [/*eh*/ string[], /*l*/ string]): string {
  return `::${safeJoin(data[0], ':')}:${data[1]}`;
}
/** @internal */
export function onlyTrailingUnmapper(value: unknown): [string[], string] {
  // Shape:
  // >  "::" 5( h16 ":" ) ls32
  if (typeof value !== 'string') throw new Error('Invalid type');
  if (!safeStartsWith(value, '::')) throw new Error('Invalid value');
  return extractEhAndL(safeSubstring(value, 2));
}

/** @internal */
export function multiTrailingMapper(data: [/*bh*/ string[], /*eh*/ string[], /*l*/ string]): string {
  return `${safeJoin(data[0], ':')}::${safeJoin(data[1], ':')}:${data[2]}`;
}
/** @internal */
export function multiTrailingUnmapper(value: unknown): [string[], string[], string] {
  // Shape:
  // >  [               h16 ] "::" 4( h16 ":" ) ls32
  // >  [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
  // >  [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
  // >  [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
  if (typeof value !== 'string') throw new Error('Invalid type');
  const [bhString, trailingString] = safeSplit(value, '::', 2);
  const [eh, l] = extractEhAndL(trailingString);
  return [readBh(bhString), eh, l];
}

/** @internal */
export function multiTrailingMapperOne(data: [/*bh*/ string[], /*eh*/ string, /*l*/ string]): string {
  return multiTrailingMapper([data[0], [data[1]], data[2]]);
}
/** @internal */
export function multiTrailingUnmapperOne(value: unknown): [string[], string, string] {
  // Shape:
  // >  [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
  const out = multiTrailingUnmapper(value);
  return [out[0], safeJoin(out[1], ':') /* nothing to join in theory */, out[2]];
}

/** @internal */
export function singleTrailingMapper(data: [/*bh*/ string[], /*l / eh*/ string]): string {
  return `${safeJoin(data[0], ':')}::${data[1]}`;
}
/** @internal */
export function singleTrailingUnmapper(value: unknown): [string[], string] {
  // Shape:
  // >  [ *4( h16 ":" ) h16 ] "::" ls32
  // >  [ *5( h16 ":" ) h16 ] "::" h16
  if (typeof value !== 'string') throw new Error('Invalid type');
  const [bhString, trailing] = safeSplit(value, '::', 2);
  return [readBh(bhString), trailing];
}

/** @internal */
export function noTrailingMapper(data: [/*bh*/ string[]]): string {
  return `${safeJoin(data[0], ':')}::`;
}
/** @internal */
export function noTrailingUnmapper(value: unknown): [string[]] {
  // Shape:
  // >  [ *6( h16 ":" ) h16 ] "::"
  if (typeof value !== 'string') throw new Error('Invalid type');
  if (!safeEndsWith(value, '::')) throw new Error('Invalid value');
  return [readBh(safeSubstring(value, 0, value.length - 2))];
}
