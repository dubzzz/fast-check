// All the implementations below are directly taken from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference

/** @hidden */
export const ObjectEntries = (obj: any): [string, any][] => {
  if (Object.entries) return Object.entries(obj);
  const ownProps = Object.keys(obj);
  let i = ownProps.length;
  const resArray = new Array(i);
  while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];
  return resArray;
};

/** hidden */
export const StringPadEnd = (src: string, targetLength: number, padString: string) => {
  if (src && src.padEnd) return src.padEnd(targetLength, padString);
  targetLength = targetLength >> 0;
  padString = String(typeof padString !== 'undefined' ? padString : ' ');
  if (src.length > targetLength) {
    return String(src);
  } else {
    targetLength = targetLength - src.length;
    while (targetLength > padString.length) {
      padString += padString;
    }
    return String(src) + padString.slice(0, targetLength);
  }
};

/** @hidden */
export const StringPadStart = (src: string, targetLength: number, padString: string) => {
  if (src && src.padStart) return src.padStart(targetLength, padString);
  targetLength = targetLength >> 0;
  padString = String(typeof padString !== 'undefined' ? padString : ' ');
  if (src.length > targetLength) {
    return String(src);
  } else {
    targetLength = targetLength - src.length;
    while (targetLength > padString.length) {
      padString += padString;
    }
    return padString.slice(0, targetLength) + String(src);
  }
};
