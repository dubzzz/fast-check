import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { buildTestWithPropRunner } from '../src/internals/TestWithPropRunnerBuilder.js';
import type { It } from '../src/internals/types.js';

describe('property export compatibility', () => {
  it.each([true, false])('should execute async predicates when asyncProperty is available: %s', async (legacy) => {
    const register = vi.fn();
    const predicate = vi.fn(async (_value: number) => {
      await Promise.resolve();
      return true;
    });
    const property = legacy
      ? () => {
          throw new Error('The legacy synchronous property must not be used');
        }
      : fc.property;
    const compatibleFc = { ...fc, property, asyncProperty: legacy ? fc.property : undefined };

    buildTestWithPropRunner(
      register as unknown as It,
      'compatible property',
      [fc.constant(42)],
      predicate,
      { numRuns: 2 },
      1000,
      {},
      compatibleFc,
    );
    const run = register.mock.calls[0][1] as () => Promise<void>;
    await run();

    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenCalledWith(42);
  });
});
