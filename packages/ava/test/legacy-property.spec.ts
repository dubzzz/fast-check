import { describe, expect, it, vi } from 'vitest';
import test from 'ava';
import type { ExecutionContext } from 'ava';
import * as fc from 'fast-check';
import { testProp } from '../src/ava-fast-check.js';

vi.mock('ava', () => ({
  default: Object.assign(vi.fn(), { before: vi.fn(), after: vi.fn() }),
}));

vi.mock('fast-check', async (importOriginal) => {
  const actual = await importOriginal<typeof fc>();
  return {
    ...actual,
    asyncProperty: actual.property,
    property: () => {
      throw new Error('The legacy synchronous property must not be used');
    },
  };
});

describe('legacy asyncProperty export', () => {
  it('should execute asynchronous AVA predicates using asyncProperty', async () => {
    const predicate = vi.fn(async (_t: ExecutionContext, _value: number) => {
      await Promise.resolve();
    });
    testProp('legacy property', [fc.constant(42)], predicate, { numRuns: 2 });
    const context = {
      try: vi.fn(async (run: (t: unknown) => Promise<void>) => {
        await run({});
        return { passed: true, commit: vi.fn() };
      }),
      log: vi.fn(),
      pass: vi.fn(),
      fail: vi.fn(),
    };
    const run = vi.mocked(test).mock.calls[0][1] as (t: typeof context) => Promise<void>;

    await run(context);

    expect(context.fail).not.toHaveBeenCalled();
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenCalledWith(expect.anything(), 42);
  });
});
