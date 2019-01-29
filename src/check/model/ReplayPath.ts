/** @hidden */
interface Count {
  value: boolean;
  count: number;
}

/** @hidden */
export class ReplayPath {
  static parse(replayPathStr: string): boolean[] {
    if (replayPathStr.length % 2 !== 0) throw new Error(`Invalid replayPath ${JSON.stringify(replayPathStr)}`);

    const replayPath: boolean[] = [];
    for (let idx = 0; idx !== replayPathStr.length; idx += 2) {
      const count = this.b64ToInt(replayPathStr.charAt(idx)) + 1;
      const value = replayPathStr.charAt(idx + 1) === '1';
      for (let num = 0; num !== count; ++num) replayPath.push(value);
    }
    return replayPath;
  }
  static stringify(replayPath: boolean[]): string {
    const aggregatedPath = replayPath.reduce((counts: Count[], cur: boolean) => {
      if (counts.length === 0 || counts[counts.length - 1].count === 64 || counts[counts.length - 1].value !== cur)
        counts.push({ value: cur, count: 1 });
      else counts[counts.length - 1].count += 1;
      return counts;
    }, []);
    return aggregatedPath
      .map(({ value, count }) => {
        const b64 = this.intToB64(count - 1);
        return value ? `${b64}1` : `${b64}0`;
      })
      .join('');
  }
  static intToB64(n: number): string {
    if (n < 26) return String.fromCharCode(n + 65); // A-Z
    if (n < 52) return String.fromCharCode(n + 97 - 26); // a-z
    if (n < 62) return String.fromCharCode(n + 48 - 52); // 0-9
    return String.fromCharCode(n === 62 ? 43 : 47); // +/
  }
  static b64ToInt(c: string): number {
    if ('A' <= c && c <= 'Z') return c.charCodeAt(0) - 65;
    if ('a' <= c && c <= 'z') return c.charCodeAt(0) - 97 + 26;
    if ('0' <= c && c <= '9') return c.charCodeAt(0) - 48 + 52;
    return c === '+' ? 62 : 63;
  }
}
