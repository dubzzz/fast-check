/** @hidden */
export class ReplayPath {
  static parse(replayPathStr: string): boolean[] {
    return [...replayPathStr].map(v => v === '1');
  }
  static stringify(replayPath: boolean[]): string {
    return replayPath.map(s => (s ? '1' : '0')).join('');
  }
}
