import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`TimeoutPlugin (seed: ${seed})`, () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it.each([
    { ordering: 'timeout, beforeEach, afterEach', timeoutFirst: true },
    { ordering: 'beforeEach, afterEach, timeout', timeoutFirst: false },
  ])(
    'should always run hooks not wrapped by the timeout even in case of timeout (plugins: $ordering)',
    async ({ timeoutFirst }) => {
      // Arrange
      vi.useFakeTimers();
      let numRuns = 0;
      const beforeEach = vi.fn();
      const afterEach = vi.fn();
      const hooksPlugins = [fc.beforeEach(beforeEach), fc.afterEach(afterEach)];
      const plugins = timeoutFirst ? [fc.timeout(10), ...hooksPlugins] : [...hooksPlugins, fc.timeout(10)];

      // Act
      const outPromise = fc.check(
        fc.asyncProperty(fc.noShrink(fc.integer()), async (_x) => {
          ++numRuns;
          await new Promise((resolve) => {
            setTimeout(resolve, 100); // delay of 100ms (longer than timeout)
          });
        }),
        { plugins },
      );
      await vi.advanceTimersByTimeAsync(10);
      const out = await outPromise;

      // Assert
      expect(out.failed).toBe(true);
      expect(out.interrupted).toBe(false);
      expect(out.numRuns).toBe(1); // only once, it timeouts on first run and then shrink (no-shrink here)
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect((out.errorInstance as Error).message).toContain('Property timeout: exceeded limit of 10 milliseconds');
      expect(numRuns).toBe(1);
      expect(beforeEach).toHaveBeenCalledTimes(1); // called before the predicate even starts
      if (timeoutFirst) {
        expect(afterEach).toHaveBeenCalledTimes(0); // predicate still running and afterEach waits for it to end before being fired
        await vi.advanceTimersByTimeAsync(100);
        expect(afterEach).toHaveBeenCalledTimes(1); // triggered once the predicate ends, so after we received the status for the run
      } else {
        expect(afterEach).toHaveBeenCalledTimes(1); // predicate still running, but afterEach wraps the timeout-ed section so it gets triggered
      }
    },
  );

  it('should have no effect on synchronous properties', () => {
    // Arrange
    let numRuns = 0;

    // Act
    const out = fc.check(
      fc.property(fc.integer(), (_x) => {
        ++numRuns;
      }),
      { plugins: [fc.timeout(10)] },
    );

    // Assert
    expect(out.failed).toBe(false);
    expect(out.interrupted).toBe(false);
    expect(out.numRuns).toBe(100);
    expect(numRuns).toBe(100);
  });
});
