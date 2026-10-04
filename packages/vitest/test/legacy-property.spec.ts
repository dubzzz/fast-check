import { expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { it } from '../src/vitest-fast-check.js';

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

it.prop([fc.constant(42)], { numRuns: 2 })('should use asyncProperty for legacy property tests', async (value) => {
  await Promise.resolve();
  expect(value).toBe(42);
});

it('should use asyncProperty for legacy generator tests', async ({ g }) => {
  await Promise.resolve();
  expect(g(fc.constant, 42)).toBe(42);
});
