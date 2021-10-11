import { MaybeMocked } from 'ts-jest/dist/utils/testing';
import { INextRawProperty } from '../../../../../src/check/property/INextRawProperty';

/**
 * Generate a fake instance inheriting from INextRawProperty with all methods being mocked
 */
export function fakeNextProperty<T = unknown, TIsAsync extends boolean = boolean>(
  isAsyncResponse?: TIsAsync
): { instance: INextRawProperty<T, TIsAsync> } & MaybeMocked<INextRawProperty<T, TIsAsync>> {
  const isAsync = jest.fn();
  if (isAsyncResponse !== undefined) {
    isAsync.mockReturnValue(isAsyncResponse);
  }
  const generate = jest.fn();
  const shrink = jest.fn();
  const run = jest.fn();
  class MyProperty implements INextRawProperty<unknown, boolean> {
    isAsync = isAsync;
    generate = generate;
    shrink = shrink;
    run = run;
  }
  return { instance: new MyProperty(), isAsync, generate, shrink, run };
}
