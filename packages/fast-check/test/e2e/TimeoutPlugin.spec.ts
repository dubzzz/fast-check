import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`TimeoutPlugin (seed: ${seed})`, () => {
  it('should stop long-running predicates with the timeout plugin', async () => {
    // Arrange / Act
    const out = await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => {
        return new Promise<boolean>(() => {}); // never ending predicate
      }),
      { plugins: [fc.timeout(10)], endOnFailure: true },
    );

    // Assert
    expect(out.failed).toBe(true);
    expect((out.errorInstance as Error).message).toContain('Property timeout: exceeded limit of 10 milliseconds');
  });
});
