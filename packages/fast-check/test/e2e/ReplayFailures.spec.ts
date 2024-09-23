import { describe, it, expect } from 'vitest';
import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`ReplayFailures (seed: ${seed})`, () => {
  const propArbitrary = fc.uniqueArray(fc.string());
  const propCheck = (data: string[]) => {
    // element at <idx> should not contain the first character of the element just before
    // 01, 12, 20  - is correct
    // 01, 12, 21  - is not
    if (data.length === 0) return true;
    for (let idx = 1; idx < data.length; ++idx) {
      if (data[idx].indexOf(data[idx - 1][0]) !== -1) return false;
    }
    return true;
  };
  const prop = fc.property(propArbitrary, propCheck);

  describe('fc.sample', () => {
    it('Should rebuild counterexample using sample and (path, seed)', () => {
      const out = fc.check(prop, { seed: seed });
      expect(out.failed).toBe(true);
      expect(fc.sample(propArbitrary, { seed: seed, path: out.counterexamplePath!, numRuns: 1 })).toEqual(
        out.counterexample,
      );
    });
    it('Should rebuild the whole shrink path using sample', () => {
      const failuresRecorded: string[][] = [];
      const out = fc.check(
        fc.property(propArbitrary, (data) => {
          if (propCheck(data)) return true;
          failuresRecorded.push(data);
          return false;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);

      const replayedFailures = [];
      const segments = out.counterexamplePath!.split(':');
      for (let idx = 1; idx !== segments.length + 1; ++idx) {
        const p = segments.slice(0, idx).join(':');
        const g = fc.sample(propArbitrary, { seed: seed, path: p, numRuns: 1 });
        replayedFailures.push(g[0]);
      }
      expect(replayedFailures).toEqual(failuresRecorded);
    });
  });
  describe('fc.assert', () => {
    it('Should start from the minimal counterexample given its path', () => {
      const out = fc.check(prop, { seed: seed });
      expect(out.failed).toBe(true);

      let numCalls = 0;
      let numValidCalls = 0;
      let validCallIndex = -1;
      const out2 = fc.check(
        fc.property(propArbitrary, (data) => {
          try {
            expect(data).toEqual(out.counterexample![0]);
            validCallIndex = numCalls;
            ++numValidCalls;
          } catch (err) {
            // noop
          }
          ++numCalls;
          return propCheck(data);
        }),
        { seed: seed, path: out.counterexamplePath! },
      );
      expect(numValidCalls).toEqual(1);
      expect(validCallIndex).toEqual(0);
      expect(out2.numRuns).toEqual(1);
      expect(out2.numShrinks).toEqual(0);
      expect(out2.counterexamplePath).toEqual(out.counterexamplePath);
      expect(out2.counterexample).toEqual(out.counterexample);
    });
    it('Should start from any position in the path', () => {
      const out = fc.check(prop, { seed: seed });
      expect(out.failed).toBe(true);

      const segments = out.counterexamplePath!.split(':');
      for (let idx = 1; idx !== segments.length + 1; ++idx) {
        const p = segments.slice(0, idx).join(':');
        const outMiddlePath = fc.check(prop, { seed: seed, path: p });
        expect(outMiddlePath.numRuns).toEqual(1);
        expect(outMiddlePath.numShrinks).toEqual(out.numShrinks - idx + 1);
        expect(outMiddlePath.counterexamplePath).toEqual(out.counterexamplePath);
        expect(outMiddlePath.counterexample).toEqual(out.counterexample);
      }
    });
    it('Should only execute one test given path for failure and noShrink flag', () => {
      const out = fc.check(prop, { seed: seed });
      expect(out.failed).toBe(true);

      const segments = out.counterexamplePath!.split(':');
      for (let idx = 1; idx !== segments.length + 1; ++idx) {
        const p = segments.slice(0, idx).join(':');
        const outMiddlePath = fc.check(prop, { seed: seed, path: p, endOnFailure: true });
        expect(outMiddlePath.numRuns).toEqual(1);
        expect(outMiddlePath.numShrinks).toEqual(0);
        expect(outMiddlePath.counterexamplePath).toEqual(p);
      }
    });
    it('Should take initial path into account when computing path', () => {
      const out = fc.check(prop, { seed: seed });
      expect(out.failed).toBe(true);

      const segments = out.counterexamplePath!.split(':');
      const playOnIndex = (seed >>> 0) % segments.length; // seed could be <0

      for (let offset = 0; offset !== +segments[playOnIndex]; ++offset) {
        const p = [...segments.slice(0, playOnIndex), offset].join(':');
        const outMiddlePath = fc.check(prop, { seed: seed, path: p });
        expect(outMiddlePath.counterexamplePath).toEqual(out.counterexamplePath);
        expect(outMiddlePath.counterexample).toEqual(out.counterexample);
      }
    });
    it('Should print the rejected path when unable to replay for path', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.nat({ max: 100 }), { minLength: 3 }).map((elements) => elements.join(':')),
          (internalSeed, path) => {
            expect(() =>
              fc.check(
                fc.property(fc.constant(0), () => {}), // no shrink available on constant, our path should break
                { seed: internalSeed, path },
              ),
            ).toThrowError(new RegExp(`wrong path=${path}`));
          },
        ),
        { seed },
      );
    });
    it('Should print the rejected path when unable to replay for path on sample', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.nat({ max: 100 }), { minLength: 3 }).map((elements) => elements.join(':')),
          (internalSeed, path) => {
            expect(() =>
              fc.sample(
                fc.constant(0), // no shrink available on constant, our path should break
                { seed: internalSeed, path },
              ),
            ).toThrowError(new RegExp(`wrong path=${path}`));
          },
        ),
        { seed },
      );
    });
  });
});
