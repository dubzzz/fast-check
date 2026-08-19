import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`TimeLimitPlugins (seed: ${seed})`, () => {
  it('should skip runs started after the time limit with the skipAllAfterTimeLimit plugin', () => {
    // Arrange / Act
    const out = fc.check(
      fc.property(fc.integer(), (_x) => true),
      { plugins: [fc.skipAllAfterTimeLimit(0)] },
    );

    // Assert
    expect(out.failed).toBe(true); // too many skipped runs
    expect(out.interrupted).toBe(false);
  });

  it('should interrupt long runs with the interruptAfterTimeLimit plugin', async () => {
    // Arrange / Act
    const out = await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => {
        return new Promise<boolean>(() => {}); // never ending predicate
      }),
      { plugins: [fc.interruptAfterTimeLimit(10)] },
    );

    // Assert
    expect(out.interrupted).toBe(true);
  });
});
