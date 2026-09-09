import { describe, expect, it, vi } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';
import { beforeEach } from 'node:test';

describe(`TimeLimitPlugins (seed: ${seed})`, () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should not fail on interrupt when not flagged with failOnInterrupt', async () => {
    // Arrange
    vi.useFakeTimers();

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
    vi.useFakeTimers();

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
    vi.useFakeTimers();

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
