/** @internal */
export function stringToBase64Mapper(s: string): string {
  switch (s.length % 4) {
    case 0:
      return s;
    case 3:
      return `${s}=`;
    case 2:
      return `${s}==`;
    default:
      return s.slice(1); // remove one extra char to get to %4 == 0
  }
}
