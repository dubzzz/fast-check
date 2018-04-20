import * as assert from 'assert';
import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`ReplayFailures (seed: ${seed})`, () => {
  const propArbitrary = fc.set(fc.hexaString());
  const propCheck = data => {
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
      assert.ok(out.failed, 'Should have failed');
      assert.deepStrictEqual(
        fc.sample(propArbitrary, { seed: seed, path: out.counterexamplePath, numRuns: 1 })[0],
        out.counterexample[0]
      );
    });
    it('Should rebuild the whole shrink path using sample', () => {
      let failuresRecorded = [];
      const out = fc.check(
        fc.property(propArbitrary, data => {
          if (propCheck(data)) return true;
          failuresRecorded.push(data);
          return false;
        }),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');

      let replayedFailures = [];
      const segments = out.counterexamplePath.split(':');
      for (let idx = 1; idx !== segments.length + 1; ++idx) {
        const p = segments.slice(0, idx).join(':');
        const g = fc.sample(propArbitrary, { seed: seed, path: p, numRuns: 1 });
        replayedFailures.push(g[0]);
      }
      assert.deepStrictEqual(replayedFailures, failuresRecorded);
    });
  });
  describe('fc.assert', () => {
    it('Should start from the minimal counterexample given its path', () => {
      const out = fc.check(prop, { seed: seed });
      assert.ok(out.failed, 'Should have failed');

      let numCalls = 0;
      let numValidCalls = 0;
      let validCallIndex = -1;
      const out2 = fc.check(
        fc.property(propArbitrary, data => {
          try {
            assert.deepStrictEqual(data, out.counterexample[0]);
            validCallIndex = numCalls;
            ++numValidCalls;
          } catch (err) {}
          ++numCalls;
          return propCheck(data);
        }),
        { seed: seed, path: out.counterexamplePath }
      );
      assert.equal(numValidCalls, 1);
      assert.equal(validCallIndex, 0);
      assert.equal(out2.numRuns, 1);
      assert.equal(out2.numShrinks, 0);
      assert.equal(out2.counterexamplePath, out.counterexamplePath);
      assert.deepStrictEqual(out2.counterexample, out.counterexample);
    });
    it('Should start from any position in the path', () => {
      const out = fc.check(prop, { seed: seed });
      assert.ok(out.failed, 'Should have failed');

      const segments = out.counterexamplePath.split(':');
      for (let idx = 1; idx !== segments.length + 1; ++idx) {
        const p = segments.slice(0, idx).join(':');
        const outMiddlePath = fc.check(prop, { seed: seed, path: p });
        assert.equal(outMiddlePath.numRuns, 1);
        assert.equal(outMiddlePath.numShrinks, out.numShrinks - idx + 1);
        assert.equal(outMiddlePath.counterexamplePath, out.counterexamplePath);
        assert.deepStrictEqual(outMiddlePath.counterexample, out.counterexample);
      }
    });
    it('Should take initial path into account when computing path', () => {
      const out = fc.check(prop, { seed: seed });
      assert.ok(out.failed, 'Should have failed');

      const segments = out.counterexamplePath.split(':');
      const playOnIndex = seed % segments.length;

      for (let offset = 0; offset !== +segments[playOnIndex]; ++offset) {
        const p = [...segments.slice(0, playOnIndex), offset].join(':');
        const outMiddlePath = fc.check(prop, { seed: seed, path: p });
        assert.equal(outMiddlePath.counterexamplePath, out.counterexamplePath);
        assert.deepStrictEqual(outMiddlePath.counterexample, out.counterexample);
      }
    });
  });
});
