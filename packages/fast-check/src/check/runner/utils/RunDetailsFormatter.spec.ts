import { describe, expect, it } from 'vitest';
import { buildErrorMessage } from './RunDetailsFormatter.js';
import { VerbosityLevel } from '../configuration/VerbosityLevel.js';
import type { RunDetailsFailureProperty } from '../reporter/RunDetails.js';
import { asyncToStringMethod } from '../../../utils/stringify.js';

describe('buildErrorMessage', () => {
  it('should return the message synchronously when values stringify synchronously', () => {
    // Arrange
    const runDetails = failureDetails(42);

    // Act
    const message = buildErrorMessage(
      (stringify) => ({ message: `Counterexample: ${stringify(runDetails.counterexample)}` }),
      runDetails,
    );

    // Assert
    expect(message).toBe(
      'Counterexample: [42]\n\nHint: Increase the verbosity level to see more details about the run',
    );
  });

  it('should resolve the message when values require asynchronous stringification', async () => {
    // Arrange
    const runDetails = failureDetails({ [asyncToStringMethod]: async () => 'custom value' });

    // Act
    const message = buildErrorMessage(
      (stringify) => ({ message: `Counterexample: ${stringify(runDetails.counterexample)}` }),
      runDetails,
    );

    // Assert
    expect(message).toBeInstanceOf(Promise);
    await expect(message).resolves.toBe(
      'Counterexample: [custom value]\n\nHint: Increase the verbosity level to see more details about the run',
    );
  });

  it('should resolve asynchronous values in verbose failure details', async () => {
    // Arrange
    const runDetails = failureDetails(42);
    runDetails.verbose = VerbosityLevel.Verbose;
    runDetails.failures = [[{ [asyncToStringMethod]: async () => 'custom failure' }]];

    // Act
    const message = buildErrorMessage(() => ({ message: 'Failed', hints: ['Custom hint'] }), runDetails);

    // Assert
    expect(message).toBeInstanceOf(Promise);
    await expect(message).resolves.toBe(
      'Failed\n\nEncountered failures were:\n- [custom failure]\n\nHint (1): Custom hint\nHint (2): Increase the verbosity level to see more details about the run',
    );
  });
});

// Helpers

function failureDetails(value: unknown): RunDetailsFailureProperty<unknown[]> {
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
    runConfiguration: {},
  };
}
