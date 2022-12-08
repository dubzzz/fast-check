import { MaybeMocked } from '../../../__test-helpers__/Mocked';
import { IRawProperty } from '../../../../../src/check/property/IRawProperty';

/**
 * Generate a fake instance inheriting from IRawProperty with all methods being mocked
 */
export function fakeProperty<T = unknown, TIsAsync extends boolean = boolean>(
  isAsyncResponse?: TIsAsync
): { instance: IRawProperty<T, TIsAsync> } & MaybeMocked<IRawProperty<T, TIsAsync>> {
  const isAsync = jest.fn();
  if (isAsyncResponse !== undefined) {
    isAsync.mockReturnValue(isAsyncResponse);
  }
  const generate = jest.fn();
  const shrink = jest.fn();
  const run = jest.fn();
  const runBeforeEach = jest.fn();
  const runAfterEach = jest.fn();
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
