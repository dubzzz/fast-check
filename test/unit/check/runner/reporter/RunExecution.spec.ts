import * as fc from '../../../../../lib/fast-check';

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
            failureId: fc.nat(1000),
            message: fc.fullUnicodeString()
          }),
          1,
          10
        ),
        (seed, storeFailures, failuresDesc) => {
          // Simulate the run
          const run = new RunExecution<number>(storeFailures);
          for (let idx = 0; idx !== failuresDesc[0].failureId; ++idx) {
            run.success();
          }
          for (const f of failuresDesc) {
            run.fail(f.value, f.failureId, f.message);
          }
          // Assert the value
          const lastFailure = failuresDesc[failuresDesc.length - 1];
          const details = run.toRunDetails(seed, '', 42, 10000);
          expect(details.failed).toBe(true);
          expect(details.counterexamplePath).not.toBe(null);
          expect(details.counterexamplePath!.length > 0).toBe(true);
          expect(details.seed).toEqual(seed);
          expect(details.numRuns).toEqual(failuresDesc[0].failureId + 1);
          expect(details.numSkips).toEqual(0);
          expect(details.numShrinks).toEqual(failuresDesc.length - 1);
          expect(details.counterexample).toEqual(lastFailure.value);
          expect(details.error).toEqual(lastFailure.message);
          expect(details.failures).toEqual(storeFailures ? failuresDesc.map(f => f.value) : []);
        }
      )
    ));
  it('Should generate correct counterexamplePath with no initial offset', () =>
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.nat(1000), 1, 10), (seed, path) => {
        // Simulate the run
        const run = new RunExecution<number>(false);
        for (let idx = 0; idx !== path[0]; ++idx) {
          run.success();
        }
        for (const failureId of path) {
          run.fail(42, failureId, 'Failed');
        }
        // Assert the value
        expect(run.toRunDetails(seed, '', 42, 10000).counterexamplePath).toEqual(path.join(':'));
      })
    ));
  it('Should generate correct counterexamplePath given initial offset', () =>
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.nat(1000), 1, 10),
        fc.array(fc.nat(1000), 1, 10),
        (seed, offsetPath, addedPath) => {
          // Simulate the run
          const run = new RunExecution<number>(false);
          for (let idx = 0; idx !== addedPath[0]; ++idx) {
            run.success();
          }
          for (const failureId of addedPath) {
            run.fail(42, failureId, 'Failed');
          }
          // Build the expected path
          const joinedPath = [...offsetPath, ...addedPath.slice(1)];
          joinedPath[offsetPath.length - 1] += addedPath[0];
          // Assert the value
          expect(run.toRunDetails(seed, offsetPath.join(':'), 42, 10000).counterexamplePath).toEqual(
            joinedPath.join(':')
          );
        }
      )
    ));
});
