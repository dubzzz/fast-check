import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { RunExecution } from '../../../../../src/check/runner/reporter/RunExecution';
import { VerbosityLevel } from '../../../../../src/check/runner/configuration/VerbosityLevel';
import { ExecutionStatus } from '../../../../../src/fast-check';
import { QualifiedParameters } from '../../../../../src/check/runner/configuration/QualifiedParameters';

describe('RunExecution', () => {
  it('Should expose data coming from the last failure', () =>
    fc.assert(
      fc.property(
        fc.integer(),
        fc.constantFrom(VerbosityLevel.None, VerbosityLevel.Verbose, VerbosityLevel.VeryVerbose),
        fc.array(
          fc.record({
            value: fc.integer(),
            failureId: fc.nat(1000),
            error: fc.string({ unit: 'binary' }).map((message) => new Error(message)),
          }),
          { minLength: 1 },
        ),
        (seed, verbosityLevel, failuresDesc) => {
          // Simulate the run
          const run = new RunExecution<number>(verbosityLevel, false);
          for (let idx = 0; idx !== failuresDesc[0].failureId; ++idx) {
            run.success(idx);
          }
          for (const f of failuresDesc) {
            run.fail(f.value, f.failureId, { error: f.error });
          }
          // Assert the value
          const lastFailure = failuresDesc[failuresDesc.length - 1];
          const details = run.toRunDetails(seed, '', 10000, QualifiedParameters.read({}));
          expect(details.failed).toBe(true);
          expect(details.interrupted).toBe(false);
          expect(details.counterexamplePath).not.toBe(null);
          expect(details.counterexamplePath!.length > 0).toBe(true);
          expect(details.seed).toBe(seed);
          expect(details.numRuns).toBe(failuresDesc[0].failureId + 1);
          expect(details.numSkips).toBe(0);
          expect(details.numShrinks).toBe(failuresDesc.length - 1);
          expect(details.counterexample).toEqual(lastFailure.value);
          expect(details.errorInstance).toBe(lastFailure.error);
          expect(details.verbose).toBe(verbosityLevel);
          expect(details.failures).toEqual(
            verbosityLevel >= VerbosityLevel.Verbose ? failuresDesc.map((f) => f.value) : [],
          );
          if (verbosityLevel === VerbosityLevel.None) expect(details.executionSummary).toHaveLength(0);
          else if (verbosityLevel === VerbosityLevel.Verbose) expect(details.executionSummary).toHaveLength(1);
          else if (verbosityLevel === VerbosityLevel.VeryVerbose)
            expect(details.executionSummary).toHaveLength(details.numRuns + details.numSkips);
        },
      ),
    ));
  it('Should generate correct counterexamplePath with no initial offset', () =>
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.nat(1000), { minLength: 1 }), (seed, path) => {
        // Simulate the run
        const run = new RunExecution<number>(VerbosityLevel.None, false);
        for (let idx = 0; idx !== path[0]; ++idx) {
          run.success(idx);
        }
        for (const failureId of path) {
          run.fail(42, failureId, { error: new Error('Failed') });
        }
        // Assert the value
        expect(run.toRunDetails(seed, '', 10000, QualifiedParameters.read({})).counterexamplePath).toEqual(
          path.join(':'),
        );
      }),
    ));
  it('Should generate correct counterexamplePath given initial offset', () =>
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.nat(1000), { minLength: 1 }),
        fc.array(fc.nat(1000), { minLength: 1 }),
        (seed, offsetPath, addedPath) => {
          // Simulate the run
          const run = new RunExecution<number>(VerbosityLevel.None, false);
          for (let idx = 0; idx !== addedPath[0]; ++idx) {
            run.success(idx);
          }
          for (const failureId of addedPath) {
            run.fail(42, failureId, { error: new Error('Failed') });
          }
          // Build the expected path
          const joinedPath = [...offsetPath, ...addedPath.slice(1)];
          joinedPath[offsetPath.length - 1] += addedPath[0];
          // Assert the value
          expect(
            run.toRunDetails(seed, offsetPath.join(':'), 10000, QualifiedParameters.read({})).counterexamplePath,
          ).toEqual(joinedPath.join(':'));
        },
      ),
    ));
  it('Should produce an execution summary corresponding to the execution', () =>
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            status: fc.constantFrom(ExecutionStatus.Success, ExecutionStatus.Failure, ExecutionStatus.Skipped),
            value: fc.nat(),
          }),
          {
            minLength: 1,
            maxLength: 100,
          },
        ),
        (executionStatuses) => {
          // Simulate the run
          const run = new RunExecution<number>(VerbosityLevel.VeryVerbose, false);
          for (let idx = 0; idx !== executionStatuses.length; ++idx) {
            switch (executionStatuses[idx].status) {
              case ExecutionStatus.Success:
                run.success(executionStatuses[idx].value);
                break;
              case ExecutionStatus.Failure:
                run.fail(executionStatuses[idx].value, idx, { error: new Error('no message') });
                break;
              case ExecutionStatus.Skipped:
                run.skip(executionStatuses[idx].value);
                break;
            }
          }
          const details = run.toRunDetails(0, '', executionStatuses.length + 1, QualifiedParameters.read({}));
          let currentExecutionTrees = details.executionSummary;
          for (let idx = 0, idxInTrees = 0; idx !== executionStatuses.length; ++idx, ++idxInTrees) {
            // Ordered like execution: same value and status
            expect(currentExecutionTrees[idxInTrees].value).toEqual(executionStatuses[idx].value);
            expect(currentExecutionTrees[idxInTrees].status).toEqual(executionStatuses[idx].status);

            if (executionStatuses[idx].status === ExecutionStatus.Failure) {
              // Failure is the end of this level of trees
              expect(currentExecutionTrees).toHaveLength(idxInTrees + 1);
              // Move to next level
              currentExecutionTrees = currentExecutionTrees[idxInTrees].children;
              idxInTrees = -1;
            } else {
              // Success and Skipped are not supposed to have children
              expect(currentExecutionTrees[idxInTrees].children).toHaveLength(0);
            }
          }
          expect(details.failures).toEqual(
            executionStatuses.filter((v) => v.status === ExecutionStatus.Failure).map((v) => v.value),
          );
        },
      ),
    ));
});
