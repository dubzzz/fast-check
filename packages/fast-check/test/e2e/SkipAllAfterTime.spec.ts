import * as fc from '../../src/fast-check';
import { seed } from './seed';

const ShortTimeoutMs = 100;
const LongTimeoutMs = 100 * 1000;

describe(`SkipAllAfterTime (seed: ${seed})`, () => {
  describe('skip', () => {
    it('should skip as soon as delay expires and mark run as failed', async () => {
      // Arrange / Act
      let numRuns = 0;
      const outPromise = fc.check(
        fc.asyncProperty(fc.integer(), async (_x) => {
          ++numRuns;
          return true;
        }),
        { skipAllAfterTimeLimit: 0 }
      );
      const out = await outPromise;

      // Assert
      expect(out.failed).toBe(true); // Not enough tests have been executed
      expect(out.interrupted).toBe(false);
      expect(out.numRuns).toBe(0);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(10001); // maxSkipsPerRun(100) * numRuns(100) +1
      expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
    });
  });

  describe('interrupt', () => {
    it('should not even start the predicate once if asked to interrupt immediately and mark the run as failed', async () => {
      // Arrange / Act
      let numRuns = 0;
      const out = await fc.check(
        fc.asyncProperty(fc.integer(), async (_x) => {
          ++numRuns;
          return true;
        }),
        { interruptAfterTimeLimit: 0 }
      );

      // Assert
      expect(out.failed).toBe(true); // Not enough tests have been executed
      expect(out.interrupted).toBe(true);
      expect(out.numRuns).toBe(0);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
    });

    it('should be able to interrupt when the first execution if taking too long and mark run as failed', async () => {
      // Arrange / Act
      const { delay, killAllRunningTasks } = buildDelay();
      let numRuns = 0;
      const out = await fc.check(
        fc.asyncProperty(fc.integer(), async (_n) => {
          ++numRuns;
          await delay(LongTimeoutMs);
          return true;
        }),
        { interruptAfterTimeLimit: ShortTimeoutMs }
      );

      // Assert
      expect(out.failed).toBe(true); // No success received before interrupt signal
      expect(out.interrupted).toBe(true);
      expect(out.numRuns).toBe(0);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect(numRuns).toBe(1); // Called once
      killAllRunningTasks();
    });

    it.each`
      markInterruptAsFailure | description
      ${false}               | ${'as success (at least one success before it)'}
      ${true}                | ${'as failed (interrupt being considered as failure by the user)'}
    `('should interrupt as soon as delay expires and mark run $description', async ({ markInterruptAsFailure }) => {
      // Arrange / Act
      const { delay, killAllRunningTasks } = buildDelay();
      let numRuns = 0;
      const outPromise = fc.check(
        fc.asyncProperty(fc.integer(), async (_n) => {
          ++numRuns;
          await delay(numRuns === 1 ? 0 : LongTimeoutMs);
          return true;
        }),
        { interruptAfterTimeLimit: ShortTimeoutMs, markInterruptAsFailure }
      );
      const out = await outPromise;

      // Assert
      expect(out.failed).toBe(markInterruptAsFailure); // One success received before interrupt signal, output depend on markInterruptAsFailure
      expect(out.interrupted).toBe(true);
      expect(out.numRuns).toBe(1);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect(numRuns).toBe(2); // Called twice: first property reached the end, second got interrupted
      killAllRunningTasks();
    });

    it.each`
      markInterruptAsFailure
      ${false}
      ${true}
    `(
      'should not interrupt anything if runs can be executed within the requested delay when markInterruptAsFailure=$markInterruptAsFailure',
      async ({ markInterruptAsFailure }) => {
        // Arrange / Act
        const { delay, killAllRunningTasks } = buildDelay();
        let numRuns = 0;
        const out = await fc.check(
          fc.asyncProperty(fc.integer(), async (_n) => {
            ++numRuns;
            await delay(0);
            return true;
          }),
          { interruptAfterTimeLimit: LongTimeoutMs, markInterruptAsFailure }
        );

        // Assert
        expect(out.failed).toBe(false);
        expect(out.interrupted).toBe(false);
        expect(out.numRuns).toBe(100);
        expect(out.numShrinks).toBe(0);
        expect(out.numSkips).toBe(0);
        expect(numRuns).toBe(100);
        killAllRunningTasks();
      }
    );
  });

  describe('both', () => {
    it('should consider interrupt with higher priority than skip', () => {
      let numRuns = 0;
      const out = fc.check(
        fc.property(fc.integer(), (_n) => {
          ++numRuns;
          return true;
        }),
        { interruptAfterTimeLimit: 0, skipAllAfterTimeLimit: 0 }
      );
      expect(out.failed).toBe(true); // No success received before interrupt signal
      expect(out.interrupted).toBe(true);
      expect(out.numRuns).toBe(0);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
    });
  });
});

// Helpers

function buildDelay() {
  const allRunningTasks: (() => void)[] = [];
  let noMoreTasks = false;

  function killAllRunningTasks() {
    noMoreTasks = true;
    allRunningTasks.forEach((stop) => stop());
  }

  function delay(timeMs: number) {
    if (noMoreTasks) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      allRunningTasks.push(resolve);
      const handle = setTimeout(resolve, timeMs);
      allRunningTasks.push(() => clearTimeout(handle));
    });
  }
  return { delay, killAllRunningTasks };
}
