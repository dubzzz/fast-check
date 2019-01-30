/** @hidden */
interface Count {
  value: boolean;
  count: number;
}

/** @hidden */
export class ReplayPath {
  static parse(replayPathStr: string): boolean[] {
    const [serializedCount, serializedChanges] = replayPathStr.split(':');
    const counts = serializedCount.split('').map(c => this.b64ToInt(c) + 1);
    const changesInt = serializedChanges.split('').map(c => this.b64ToInt(c));
    const changes: boolean[] = [];
    for (let idx = 0; idx !== changesInt.length; ++idx) {
      let current = changesInt[idx];
      for (let n = 0; n !== 6; ++n, current >>= 1) {
        changes.push(current % 2 === 1);
      }
    }

    const replayPath: boolean[] = [];
    for (let idx = 0; idx !== counts.length; ++idx) {
      const count = counts[idx];
      const value = changes[idx];
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
    const serializedCount = aggregatedPath.map(({ count }) => this.intToB64(count - 1)).join('');
    let serializedChanges = '';
    for (let idx = 0; idx < aggregatedPath.length; idx += 6) {
      const changesInt = aggregatedPath
        .slice(idx, idx + 6)
        .reduceRight((prev: number, cur: Count) => prev * 2 + (cur.value ? 1 : 0), 0);
      serializedChanges += this.intToB64(changesInt);
    }
    return `${serializedCount}:${serializedChanges}`;
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
