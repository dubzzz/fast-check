import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`VerbosityChecks (seed: ${seed})`, () => {
  it('should produce the right list of failing cases in verbose mode', () => {
    let failed = false;
    const expectedLines: string[] = [];
    try {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (x, y) => {
          fc.pre(Math.abs(x - y) >= 10);
          if (x < y && x > 0) {
            expectedLines.push(`- [${x},${y}]`);
            return false;
          }
          return true;
        }),
        {
          seed,
          verbose: fc.VerbosityLevel.Verbose,
        }
      );
    } catch (err: unknown) {
      failed = true;
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain(expectedLines.join('\n'));
    }
    expect(failed).toBe(true);
  });
  it('should produce the right execution tree in very verbose mode', () => {
    let failed = false;
    const expectedLines: string[] = [];
    let indent = '';
    try {
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (x, y) => {
          if (Math.abs(x - y) < 10) {
            expectedLines.push(`${indent}\x1b[33m!\x1b[0m [${x},${y}]`);
            fc.pre(false);
            return true; // not reacheable
          }
          if (x < y && x > 0) {
            expectedLines.push(`${indent}\x1b[31m\xD7\x1b[0m [${x},${y}]`);
            indent += '. ';
            return false;
          }
          expectedLines.push(`${indent}\x1b[32m\u221A\x1b[0m [${x},${y}]`);
          return true;
        }),
        {
          seed,
          verbose: fc.VerbosityLevel.VeryVerbose,
        }
      );
    } catch (err: unknown) {
      failed = true;
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain(expectedLines.join('\n'));
    }
    expect(failed).toBe(true);
  });
});
