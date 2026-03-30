import { vi } from 'vitest';
import type { MaybeMocked } from '../../../__test-helpers__/Mocked.js';
import type { IRawProperty } from '../../../../../src/check/property/IRawProperty.js';

/**
 * Generate a fake instance inheriting from IRawProperty with all methods being mocked
 */
export function fakeProperty<T = unknown>(): { instance: IRawProperty<T> } & MaybeMocked<Required<IRawProperty<T>>> {
  const generate = vi.fn();
  const shrink = vi.fn();
  const runBeforeEach = vi.fn();
  const runAfterEach = vi.fn();
  const run = vi.fn();
  class MyProperty implements IRawProperty<unknown> {
    generate = generate;
    shrink = shrink;
    run = run;
    runBeforeEach = runBeforeEach;
    runAfterEach = runAfterEach;
  }
  return { instance: new MyProperty(), generate, shrink, run, runBeforeEach, runAfterEach };
}
