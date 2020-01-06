/** @internal */
interface Count {
  value: boolean;
  count: number;
}

/** @internal */
export class ReplayPath {
  /** Parse a serialized replayPath */
  static parse(replayPathStr: string): boolean[] {
    const [serializedCount, serializedChanges] = replayPathStr.split(':');
    const counts = this.parseCounts(serializedCount);
    const changes = this.parseChanges(serializedChanges);
    return this.parseOccurences(counts, changes);
  }
  /** Stringify a replayPath */
  static stringify(replayPath: boolean[]): string {
    const occurences = this.countOccurences(replayPath);
    const serializedCount = this.stringifyCounts(occurences);
    const serializedChanges = this.stringifyChanges(occurences);
    return `${serializedCount}:${serializedChanges}`;
  }
  /** Number to Base64 value */
  private static intToB64(n: number): string {
    if (n < 26) return String.fromCharCode(n + 65); // A-Z
    if (n < 52) return String.fromCharCode(n + 97 - 26); // a-z
    if (n < 62) return String.fromCharCode(n + 48 - 52); // 0-9
    return String.fromCharCode(n === 62 ? 43 : 47); // +/
  }
  /** Base64 value to number */
  private static b64ToInt(c: string): number {
    if (c >= 'a' /*\x61*/) return c.charCodeAt(0) - 97 + 26;
    if (c >= 'A' /*\x41*/) return c.charCodeAt(0) - 65;
    if (c >= '0' /*\x30*/) return c.charCodeAt(0) - 48 + 52;
    return c === '+' ? 62 : 63; // \x2b or \x2f
  }
  /**
   * Divide an incoming replayPath into an array of {value, count}
   * with count is the number of consecutive occurences of value (with a max set to 64)
   *
   * Above 64, another {value, count} is created
   */
  private static countOccurences(replayPath: boolean[]): { value: boolean; count: number }[] {
    return replayPath.reduce((counts: Count[], cur: boolean) => {
      if (counts.length === 0 || counts[counts.length - 1].count === 64 || counts[counts.length - 1].value !== cur)
        counts.push({ value: cur, count: 1 });
      else counts[counts.length - 1].count += 1;
      return counts;
    }, []);
  }
  /**
   * Serialize an array of {value, count} back to its replayPath
   */
  private static parseOccurences(counts: number[], changes: boolean[]): boolean[] {
    const replayPath: boolean[] = [];
    for (let idx = 0; idx !== counts.length; ++idx) {
      const count = counts[idx];
      const value = changes[idx];
      for (let num = 0; num !== count; ++num) replayPath.push(value);
    }
    return replayPath;
  }
  /**
   * Stringify the switch from true to false of occurences
   *
   * {value: 0}, {value: 1}, {value: 1}, {value: 0}
   * will be stringified as: 6 = (1 * 0) + (2 * 1) + (4 * 1) + (8 * 0)
   *
   * {value: 0}, {value: 1}, {value: 1}, {value: 0}, {value: 1}, {value: 0}, {value: 1}, {value: 0}
   * will be stringified as: 22, 1 [only 6 values encoded in one number]
   */
  private static stringifyChanges(occurences: { value: boolean; count: number }[]) {
    let serializedChanges = '';
    for (let idx = 0; idx < occurences.length; idx += 6) {
      const changesInt = occurences
        .slice(idx, idx + 6)
        .reduceRight((prev: number, cur: Count) => prev * 2 + (cur.value ? 1 : 0), 0);
      serializedChanges += this.intToB64(changesInt);
    }
    return serializedChanges;
  }
  /**
   * Parse switch of value
   */
  private static parseChanges(serializedChanges: string): boolean[] {
    const changesInt = serializedChanges.split('').map(c => this.b64ToInt(c));
    const changes: boolean[] = [];
    for (let idx = 0; idx !== changesInt.length; ++idx) {
      let current = changesInt[idx];
      for (let n = 0; n !== 6; ++n, current >>= 1) {
        changes.push(current % 2 === 1);
      }
    }
    return changes;
  }
  /**
   * Stringify counts of occurences
   */
  private static stringifyCounts(occurences: { value: boolean; count: number }[]) {
    return occurences.map(({ count }) => this.intToB64(count - 1)).join('');
  }
  /**
   * Parse counts
   */
  private static parseCounts(serializedCount: string): number[] {
    return serializedCount.split('').map(c => this.b64ToInt(c) + 1);
  }
}
