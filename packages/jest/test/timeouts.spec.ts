import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { jest as _jest } from '@jest/globals';
import { writeToFile, runSpec, expectFail, expectTimeout } from './__test-helpers__/RunJest.js';
import { runOptions } from './__test-helpers__/RunOptions.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const jest: typeof _jest;

describe.each(runOptions)('$specName', ({ runnerName, useWorkers, testRunner }) => {
  const options = { useWorkers, testRunner };

  if (useWorkers) {
    it.concurrent('should fail on property blocking the main thread', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()], { timeout: 500 })('property block main thread', () => {
          while (true);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expect(out).toMatch(/[×✕] property block main thread/);
    });
  }

  describe('timeout', () => {
    it.concurrent('should fail as test takes longer than global Jest timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than global Jest timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 5000);
      expect(out).toMatch(/[×✕] property takes longer than global Jest timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest local timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])(
          'property takes longer than Jest local timeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest local timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest config timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, { ...options, testTimeoutConfig: 1000 }, () => {
        runner.prop([fc.nat()])('property takes longer than Jest config timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest config timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property takes longer than Jest setTimeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest setTimeout/);
    });

    it.concurrent('should fail as test takes longer than Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 1000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest CLI timeout/);
    });

    it.concurrent('should fail but favor local Jest timeout over Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(3000);
        }
        runner.prop([fc.nat()])(
          'property favor local Jest timeout over Jest setTimeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 3000 (setTimeout), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor local Jest timeout over Jest setTimeout/);
    });

    it.concurrent('should fail but favor Jest setTimeout over Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property favor Jest setTimeout over Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 3000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 3000 (cli), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor Jest setTimeout over Jest CLI timeout/);
    });
  });
});
