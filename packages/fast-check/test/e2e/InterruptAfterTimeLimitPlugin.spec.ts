import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seed } from './seed.js';

describe(`TimeLimitPlugins (seed: ${seed})`, () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should not fail on interrupt when not flagged with failOnInterrupt', async () => {
    // Arrange
    const fc = await import('../../src/fast-check.js');

    // Act / Assert
    await expect(
      fc.assert(
        fc.asyncProperty(fc.integer(), async (_x) => {
          // first run will pass, but second one will be interrupted
          vi.advanceTimersByTime(80);
        }),
        { plugins: [fc.interruptAfterTimeLimit(100, { failOnInterrupt: false })] },
      ),
    ).resolves.toBeUndefined();
  });

  it('should fail on interrupt when flagged with failOnInterrupt', async () => {
    // Arrange
    const fc = await import('../../src/fast-check.js');

    // Act / Assert
    await expect(
      fc.assert(
        fc.asyncProperty(fc.integer(), async (_x) => {
          // first run will pass, but second one will be interrupted
          vi.advanceTimersByTime(80);
        }),
        { plugins: [fc.interruptAfterTimeLimit(100, { failOnInterrupt: true })] },
      ),
    ).rejects.toThrow(/Property interrupted after 1 tests/);
  });

  it('should not fail on an interrupt from another plugin even when flagged with failOnInterrupt', async () => {
    // Arrange
    const fc = await import('../../src/fast-check.js');

    // Act / Assert
    await expect(
      fc.assert(
        fc.asyncProperty(fc.integer(), async (_x) => {
          // first run will pass, but second one will be interrupted
          vi.advanceTimersByTime(80);
        }),
        {
          plugins: [
            fc.interruptAfterTimeLimit(1000, { failOnInterrupt: true }), // not interrupted
            fc.interruptAfterTimeLimit(100, { failOnInterrupt: false }), // interrupted but considered ok
          ],
        },
      ),
    ).resolves.toBeUndefined();
  });
});
