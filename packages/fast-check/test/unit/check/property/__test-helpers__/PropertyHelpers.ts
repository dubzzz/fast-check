import { vi } from 'vitest';
import type { MaybeMocked } from '../../../__test-helpers__/Mocked.js';
import type { Property } from '../../../../../src/check/property/types/Property.js';

/**
 * Generate a fake instance inheriting from IProperty with all methods being mocked
 */
export function fakeProperty<T = unknown>(): { instance: Property<T> } & MaybeMocked<Required<Property<T>>> {
  const generate = vi.fn();
  const shrink = vi.fn();
  const runBeforeEach = vi.fn();
  const runAfterEach = vi.fn();
  const run = vi.fn();
  class MyProperty implements Property<unknown> {
    generate = generate;
    shrink = shrink;
    run = run;
    runBeforeEach = runBeforeEach;
    runAfterEach = runAfterEach;
  }
  return { instance: new MyProperty(), generate, shrink, run, runBeforeEach, runAfterEach };
}
