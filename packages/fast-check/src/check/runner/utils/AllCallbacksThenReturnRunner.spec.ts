import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { runAllCallbacksAndReturn } from './AllCallbacksThenReturnRunner.js';

describe('runAllCallbacksAndReturn', () => {
  it('should always call all callbacks in-order without interleaving them', async () => {
    await fc.assert(
      fc.property(
        fc.array(fc.record({ isSync: fc.boolean(), isSuccess: fc.boolean() })),
        async (callbacksResponses) => {
          // Arrange
          let numCalls = 0;
          let isRunning = false;
          let concurrentRunsDetected = false;
          let lastRunIndex = -1;
          let badlyOrderedRunsDetected = false;
          const callbacks = callbacksResponses.map((response, index) => () => {
            numCalls += 1;
            concurrentRunsDetected ||= isRunning;
            badlyOrderedRunsDetected ||= index <= lastRunIndex;
            lastRunIndex = index;
            if (response.isSync) {
              if (response.isSuccess) {
                return;
              }
              throw new Error('Synchronous failure');
            }
            isRunning = true;
            return delay0().then(() => {
              isRunning = false;
              if (response.isSuccess) {
                return;
              }
              throw new Error('Asynchronous failure');
            });
          });
          const value = null;

          // Act
          await runAllCallbacksAndReturn(value, (index) => callbacks[index](), callbacks.length)?.catch(() => {});

          // Assert
          expect(numCalls).toBe(callbacks.length);
          expect(isRunning).toBe(false);
          expect(concurrentRunsDetected).toBe(false);
          expect(badlyOrderedRunsDetected).toBe(false);
        },
      ),
    );
  });

  it('should never throw synchonously', async () => {
    await fc.assert(
      fc.property(
        fc.array(fc.record({ isSync: fc.boolean(), isSuccess: fc.boolean() })),
        async (callbacksResponses) => {
          // Arrange
          const callbacks = callbacksResponses.map((response) => () => {
            if (response.isSync) {
              if (response.isSuccess) {
                return;
              }
              throw new Error('Synchronous failure');
            }
            if (response.isSuccess) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('Asynchronous failure'));
          });
          const value = null;

          // Act / Assert
          expect(() =>
            runAllCallbacksAndReturn(value, (index) => callbacks[index](), callbacks.length)?.catch(() => {}),
          ).not.toThrow();
        },
      ),
    );
  });

  it('should always reject with first error', async () => {
    await fc.assert(
      fc.property(
        fc.array(fc.record({ isSync: fc.boolean(), isSuccess: fc.boolean() })),
        fc.record({ isSync: fc.boolean(), isSuccess: fc.constant(false) }),
        fc.array(fc.record({ isSync: fc.boolean(), isSuccess: fc.boolean() })),
        async (callbacksResponsesBefore, callbackFailure, callbacksResponsesAfter) => {
          // Arrange
          const callbacksResponses = [...callbacksResponsesBefore, callbackFailure, ...callbacksResponsesAfter];
          const callbacks = callbacksResponses.map((response, index) => () => {
            if (response.isSync) {
              if (response.isSuccess) {
                return;
              }
              throw new Error(`Failure on #${index}`);
            }
            if (response.isSuccess) {
              return Promise.resolve();
            }
            return Promise.reject(new Error(`Failure on #${index}`));
          });
          const expectedErrorIndex = callbacksResponses.findIndex((response) => !response.isSuccess);
          const value = null;

          // Act / Assert
          await expect(
            runAllCallbacksAndReturn(value, (index) => callbacks[index](), callbacks.length),
          ).rejects.toThrow(new Error(`Failure on #${expectedErrorIndex}`));
        },
      ),
    );
  });

  it('should return the original value after mixed synchronous and asynchronous callbacks', async () => {
    await fc.assert(
      fc.property(fc.array(fc.boolean()), async (syncFlags) => {
        // Arrange
        const value = { marker: Symbol() };
        const callbacks = syncFlags.map((isSync) => () => (isSync ? undefined : Promise.resolve()));

        // Act
        const out = await runAllCallbacksAndReturn(value, (index) => callbacks[index](), callbacks.length);

        // Assert
        expect(out).toBe(value);
      }),
    );
  });

  it('should preserve an undefined first error and still finish all callbacks', async () => {
    await fc.assert(
      fc.property(
        fc.array(fc.boolean()),
        fc.boolean(),
        fc.array(fc.record({ isSync: fc.boolean(), isSuccess: fc.boolean() })),
        async (syncFlagsBefore, firstErrorIsSync, callbacksResponsesAfter) => {
          // Arrange
          const callbacksResponses = [
            ...syncFlagsBefore.map((isSync) => ({ isSync, isSuccess: true })),
            { isSync: firstErrorIsSync, isSuccess: false },
            ...callbacksResponsesAfter,
          ];
          const firstErrorIndex = syncFlagsBefore.length;
          let completedCallbacks = 0;
          const callbacks = callbacksResponses.map((response, index) => () => {
            const complete = () => {
              ++completedCallbacks;
              if (!response.isSuccess) {
                const error = index === firstErrorIndex ? undefined : new Error('Later failure');
                throw error;
              }
            };
            return response.isSync ? complete() : Promise.resolve().then(complete);
          });

          // Act
          const out = runAllCallbacksAndReturn(Symbol(), (index) => callbacks[index](), callbacks.length);

          // Assert
          await expect(out).rejects.toBeUndefined();
          expect(completedCallbacks).toBe(callbacks.length);
        },
      ),
    );
  });

  it.each([{ callbacksCount: 0 }, { callbacksCount: 1 }, { callbacksCount: 5 }])(
    'should return the value synchonously if all callbacks are synchronous and successful (callbacks count: $callbacksCount)',
    async ({ callbacksCount }) => {
      // Arrange
      const value = Symbol();

      // Act / Assert
      const out = runAllCallbacksAndReturn(value, () => {}, callbacksCount);

      // Assert
      expect(out).toBe(value);
    },
  );
});

// Helpers

function delay0() {
  return new Promise((r) => setTimeout(r, 0));
}
