import { describe, expect, it } from 'vitest';
import { defaultReporter } from './DefaultReporterPlugin.js';
import { VerbosityLevel } from '../runner/configuration/VerbosityLevel.js';
import type { RunDetails, RunDetailsFailureProperty } from '../runner/reporter/RunDetails.js';
import { asyncToStringMethod } from '../../utils/stringify.js';

describe('defaultReporter', () => {
  describe.each([false, true])('with asynchronous stringification: %s', (asynchronous) => {
    it.each([
      { options: undefined, configured: undefined, included: false },
      { options: undefined, configured: true, included: true },
      { options: {}, configured: false, included: false },
      { options: {}, configured: true, included: true },
      { options: { includeErrorInReport: undefined }, configured: true, included: true },
      { options: { includeErrorInReport: true }, configured: undefined, included: true },
      { options: { includeErrorInReport: true }, configured: false, included: true },
      { options: { includeErrorInReport: true }, configured: true, included: true },
      { options: { includeErrorInReport: false }, configured: true, included: false },
      { options: { includeErrorInReport: false }, configured: false, included: false },
    ])(
      'should report with options=$options and run configuration=$configured',
      async ({ options, configured, included }) => {
        // Arrange
        const value = asynchronous ? { [asyncToStringMethod]: async () => 'counterexample' } : 'counterexample';
        const runDetails = failureDetails(value, configured);
        Object.freeze(runDetails.runConfiguration);
        Object.freeze(runDetails);
        const { onAllRunsComplete } = defaultReporter(options)(0, new Map());

        // Act
        let error: unknown;
        if (asynchronous) {
          const result = onAllRunsComplete!(runDetails);
          expect(result).toBeInstanceOf(Promise);
          error = await Promise.resolve(result).then(
            () => undefined,
            (err: unknown) => err,
          );
        } else {
          try {
            onAllRunsComplete!(runDetails);
          } catch (err) {
            error = err;
          }
        }

        // Assert
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Property failed after 1 tests');
        expect((error as Error).message).toContain('counterexample');
        if (included) {
          expect((error as Error).message).toContain('Got error: original failure');
          expect(error).not.toHaveProperty('cause');
        } else {
          expect((error as Error).message).not.toContain('original failure');
          expect((error as Error).cause).toBe(runDetails.errorInstance);
        }
        expect(runDetails.runConfiguration.includeErrorInReport).toBe(configured);
      },
    );
  });

  it.each([false, true])(
    'should leave successful runs unchanged with includeErrorInReport=%s',
    (includeErrorInReport) => {
      // Arrange
      const runDetails: RunDetails<unknown[]> = {
        ...failureDetails(),
        failed: false,
        counterexample: null,
        counterexamplePath: null,
        errorInstance: null,
      };
      const { onAllRunsComplete } = defaultReporter({ includeErrorInReport })(0, new Map());

      // Act / Assert
      expect(onAllRunsComplete!(runDetails)).toBe(undefined);
    },
  );

  it.each([false, true])(
    'should preserve skipped-run reporting with includeErrorInReport=%s',
    (includeErrorInReport) => {
      // Arrange
      const runDetails: RunDetails<unknown[]> = {
        ...failureDetails(),
        interrupted: true,
        numRuns: 0,
        numSkips: 101,
        counterexample: null,
        counterexamplePath: null,
        errorInstance: null,
      };
      const { onAllRunsComplete } = defaultReporter({ includeErrorInReport })(0, new Map());

      // Act / Assert
      expect(() => onAllRunsComplete!(runDetails)).toThrow('Failed to run property, too many pre-condition failures');
    },
  );
});

// Helpers

function failureDetails(value: unknown = 42, includeErrorInReport?: boolean): RunDetailsFailureProperty<unknown[]> {
  return {
    failed: true,
    interrupted: false,
    numRuns: 1,
    numSkips: 0,
    numShrinks: 0,
    seed: 42,
    counterexample: [value],
    counterexamplePath: '0',
    errorInstance: new Error('original failure'),
    failures: [],
    executionSummary: [],
    verbose: VerbosityLevel.None,
    runConfiguration: { includeErrorInReport },
  };
}
