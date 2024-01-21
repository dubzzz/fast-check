import { isMainThread } from 'node:worker_threads';
import type { Parameters } from 'fast-check';
import { assert } from '@fast-check/worker';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { predicateIsolation } from './__properties__/predicateIsolation.cjs';

if (isMainThread) {
  describe('@fast-check/worker', () => {
    const jestTimeout = 10000;
    const assertTimeout = 1000;
    const defaultOptions: Parameters<unknown> = { timeout: assertTimeout };

    it(
      'should be able to isolate at predicate level with predicate level',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, numRuns: 3 }; // predicate level isolation is way longer to run

        // Act / Assert
        await expect(assert(predicateIsolation.predicateLevel, options)).resolves.not.toThrow();
      },
      jestTimeout,
    );

    it(
      'should be able to isolate at property level and thus share workers cross-predicate',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, numRuns: 3 }; // just to rely on same options as the ones of 'predicate level isolation'
        const expectedError = /Encounter counters: property, for isolation level: property/;

        // Act / Assert
        await expect(assert(predicateIsolation.propertyLevel, options)).rejects.toThrowError(expectedError);
      },
      jestTimeout,
    );

    it(
      'should be able to isolate at file level and thus share workers cross-predicate',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, numRuns: 3 }; // just to rely on same options as the ones of 'predicate level isolation'
        const expectedError = /Encounter counters: file, for isolation level: file/;

        // Act / Assert
        await expect(assert(predicateIsolation.fileLevel, options)).rejects.toThrowError(expectedError);
      },
      jestTimeout,
    );

    it(
      'should respawn a new worker when the predicate execution fails',
      async () => {
        // Arrange
        const options: Parameters<unknown> = { ...defaultOptions, verbose: 2 };

        // Act / Assert
        try {
          await assert(predicateIsolation.propertyLevel, options);
          expect('It should have thrown').toBe(null);
        } catch (err) {
          const summary = (err as Error).message.split('Execution summary:')[1];
          let foundOne = false;
          let previousLevel = null;
          const summaryLines = summary.split('\n').filter((line) => line.trim() !== '');
          for (const summaryLine of summaryLines) {
            // eslint-disable-next-line no-control-regex
            const currentLevel = summaryLine.split(/\x1b\[32m\u221A\x1b\[0m|\x1b\[31m\xD7\x1b\[0m/)[0]; // split on success tick or error cross
            if (currentLevel !== previousLevel) {
              foundOne = true;
              try {
                expect(summaryLine).toContain('\x1b[32m\u221A\x1b[0m'); // success tick
              } catch (subErr) {
                throw new Error(`Invalid summary, received:\n${summaryLines.join('\n')}\n\n${subErr}`);
              }
              previousLevel = currentLevel;
            }
          }
          expect(foundOne).toBe(true);
        }
      },
      jestTimeout,
    );
  });
}
