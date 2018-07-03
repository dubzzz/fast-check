// All the implementations below are directly taken from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference

/** @hidden */
export const ObjectEntriesImpl = (obj: any): [string, any][] => {
  const ownProps = Object.keys(obj);
  let i = ownProps.length;
  const resArray = new Array(i);
  while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];
  return resArray;
};

/** @hidden */
export const ObjectEntries = Object.entries ? Object.entries : ObjectEntriesImpl;

/** @hidden */
const repeatUpToLength = (src: string, targetLength: number): string => {
  for (; targetLength > src.length; src += src);
  return src;
};

/** @hidden */
export const StringPadEndImpl = (src: string, targetLength: number, padString: string) => {
  targetLength = targetLength >> 0;
  if (padString === '' || src.length > targetLength) return String(src);
  targetLength = targetLength - src.length;
  padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
  return String(src) + padString.slice(0, targetLength);
};

/** @hidden */
export const StringPadStartImpl = (src: string, targetLength: number, padString: string) => {
  targetLength = targetLength >> 0;
  if (padString === '' || src.length > targetLength) return String(src);
  targetLength = targetLength - src.length;
  padString = repeatUpToLength(typeof padString !== 'undefined' ? String(padString) : ' ', targetLength);
  return padString.slice(0, targetLength) + String(src);
};

const wrapStringPad = (method?: (targetLength: number, padString: string) => string) => {
  return (
    method &&
    ((src: string, targetLength: number, padString: string) => method.call(src, targetLength, padString) as string)
  );
};

/** @hidden */
export const StringPadEnd = wrapStringPad(String.prototype.padEnd) || StringPadEndImpl;

/** @hidden */
export const StringPadStart = wrapStringPad(String.prototype.padStart) || StringPadStartImpl;
