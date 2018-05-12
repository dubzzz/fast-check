import * as assert from 'assert';
import * as fc from '../../../../../lib/fast-check';

import { QualifiedParameters } from '../../../../../src/check/runner/configuration/QualifiedParameters';
import { RunExecution } from '../../../../../src/check/runner/reporter/RunExecution';

describe('RunExecution', () => {
  it('Should expose data coming from the last failure', () =>
    fc.assert(
      fc.property(
        fc.integer(),
        fc.boolean(),
        fc.array(
          fc.record({
            value: fc.integer(),
            failureId: fc.nat(),
            message: fc.fullUnicodeString()
          }),
          1,
          10
        ),
        (seed, storeFailures, failuresDesc) => {
          // Simulate the run
          const run = new RunExecution<number>(storeFailures);
          for (const f of failuresDesc) {
            run.fail(f.value, f.failureId, f.message);
          }
          // Assert the value
          const lastFailure = failuresDesc[failuresDesc.length - 1];
          const details = run.toRunDetails(seed, '', 42);
          assert.ok(details.failed);
          assert.ok(details.counterexamplePath != null && details.counterexamplePath.length > 0);
          assert.strictEqual(details.seed, seed);
          assert.strictEqual(details.numRuns, failuresDesc[0].failureId + 1);
          assert.strictEqual(details.numShrinks, failuresDesc.length - 1);
          assert.strictEqual(details.counterexample, lastFailure.value);
          assert.strictEqual(details.error, lastFailure.message);
          assert.deepStrictEqual(details.failures, storeFailures ? failuresDesc.map(f => f.value) : []);
        }
      )
    ));
  it('Should generate correct counterexamplePath with no initial offset', () =>
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.nat(), 1, 10), (seed, path) => {
        // Simulate the run
        const run = new RunExecution<number>(false);
        for (const failureId of path) {
          run.fail(42, failureId, 'Failed');
        }
        // Assert the value
        assert.strictEqual(run.toRunDetails(seed, '', 42).counterexamplePath, path.join(':'));
      })
    ));
  it('Should generate correct counterexamplePath given initial offset', () =>
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.nat(), 1, 10), fc.array(fc.nat(), 1, 10), (seed, offsetPath, addedPath) => {
        // Simulate the run
        const run = new RunExecution<number>(false);
        for (const failureId of addedPath) {
          run.fail(42, failureId, 'Failed');
        }
        // Build the expected path
        const joinedPath = [...offsetPath, ...addedPath.slice(1)];
        joinedPath[offsetPath.length - 1] += addedPath[0];
        // Assert the value
        assert.strictEqual(run.toRunDetails(seed, offsetPath.join(':'), 42).counterexamplePath, joinedPath.join(':'));
      })
    ));
});
