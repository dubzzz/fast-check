import { vi } from 'vitest';
import type { MaybeMocked } from '../../../__test-helpers__/Mocked';
import type { IRawProperty } from '../../../../../src/check/property/IRawProperty';

/**
 * Generate a fake instance inheriting from IRawProperty with all methods being mocked
 */
export function fakeProperty<T = unknown, TIsAsync extends boolean = boolean>(
  isAsyncResponse?: TIsAsync,
): { instance: IRawProperty<T, TIsAsync> } & MaybeMocked<Required<IRawProperty<T, TIsAsync>>> {
  const isAsync = vi.fn();
  if (isAsyncResponse !== undefined) {
    isAsync.mockReturnValue(isAsyncResponse);
  }
  const generate = vi.fn();
  const shrink = vi.fn();
  const runBeforeEach = vi.fn();
  const runAfterEach = vi.fn();
  const run = vi.fn();
  class MyProperty implements IRawProperty<unknown, boolean> {
    isAsync = isAsync;
    generate = generate;
    shrink = shrink;
    run = run;
    runBeforeEach = runBeforeEach;
    runAfterEach = runAfterEach;
  }
  return { instance: new MyProperty(), isAsync, generate, shrink, run, runBeforeEach, runAfterEach };
}
