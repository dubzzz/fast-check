// All the implementations below are directly taken from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference

/** @internal */
export const ObjectEntriesImpl = (obj: any): [string, any][] => {
  const ownProps = Object.keys(obj);
  let i = ownProps.length;
  const resArray = new Array(i);
  while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];
  return resArray;
};

/** @internal */
export const ObjectEntries = Object.entries ? Object.entries : ObjectEntriesImpl;

/** @internal */
const repeatUpToLength = (src: string, targetLength: number): string => {
  for (; targetLength > src.length; src += src);
  return src;
};

/** @internal */
export const StringPadEndImpl = (src: string, targetLength: number, padString: string) => {
  targetLength = targetLength >> 0;
  if (padString === '' || src.length > targetLength) return String(src);
  targetLength = targetLength - src.length;
  padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
  return String(src) + padString.slice(0, targetLength);
};

/** @internal */
export const StringPadStartImpl = (src: string, targetLength: number, padString: string) => {
  targetLength = targetLength >> 0;
  if (padString === '' || src.length > targetLength) return String(src);
  targetLength = targetLength - src.length;
  padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
  return padString.slice(0, targetLength) + String(src);
};

/** @internal */
const wrapStringPad = (method?: (targetLength: number, padString: string) => string) => {
  return (
    method &&
    ((src: string, targetLength: number, padString: string) => method.call(src, targetLength, padString) as string)
  );
};

/** @internal */
export const StringPadEnd = wrapStringPad(String.prototype.padEnd) || StringPadEndImpl;

/** @internal */
export const StringPadStart = wrapStringPad(String.prototype.padStart) || StringPadStartImpl;

/** @internal */
export const StringFromCodePointLimitedImpl = (codePoint: number): string => {
  if (codePoint < 0x10000) return String.fromCharCode(codePoint);

  codePoint -= 0x10000;
  return String.fromCharCode((codePoint >> 10) + 0xd800) + String.fromCharCode((codePoint % 0x400) + 0xdc00);
};

/** @internal */
export const StringFromCodePointLimited = String.fromCodePoint ? String.fromCodePoint : StringFromCodePointLimitedImpl;
// only takes into account a single code point
