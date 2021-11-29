import * as fc from '../../../lib/fast-check';
import { context, ContextValue } from '../../../src/arbitrary/context';

import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import { cloneMethod, hasCloneMethod, WithCloneMethod } from '../../../src/check/symbols';

import * as ConstantMock from '../../../src/arbitrary/constant';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('context', () => {
  it('should re-use constant to build the context', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constant = jest.spyOn(ConstantMock, 'constant');
    constant.mockImplementation(() => instance);

    // Act
    const arb = context();

    // Assert
    expect(constant).toHaveBeenCalledWith(expect.anything());
    expect(arb).toBe(instance);
  });

  it('should pass a cloneable context to constant', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constant = jest.spyOn(ConstantMock, 'constant');
    constant.mockImplementation(() => instance);

    // Act
    context();
    const contextValue = constant.mock.calls[0][0] as ContextValue;

    // Assert
    expect(hasCloneMethod(contextValue)).toBe(true);
  });

  it('should not reset its own logs on clone', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constant = jest.spyOn(ConstantMock, 'constant');
    constant.mockImplementation(() => instance);

    // Act
    context();
    const contextValue = constant.mock.calls[0][0] as ContextValue & WithCloneMethod<ContextValue>;
    contextValue.log('a');

    // Assert
    const contextStringBeforeClone = String(contextValue);
    expect(contextValue[cloneMethod]()).toBeDefined();
    expect(String(contextValue)).toEqual(contextStringBeforeClone);
    expect(contextValue.size()).toEqual(1);
  });

  it('should produce a clone without any logs', () => {
    // Arrange
    const { instance } = fakeNextArbitrary();
    const constant = jest.spyOn(ConstantMock, 'constant');
    constant.mockImplementation(() => instance);

    // Act
    context();
    const contextValue = constant.mock.calls[0][0] as ContextValue & WithCloneMethod<ContextValue>;
    const contextStringBeforeLog = String(contextValue);
    contextValue.log('a');
    const clonedContextValue = contextValue[cloneMethod]();

    // Assert
    expect(String(clonedContextValue)).not.toEqual(String(contextValue));
    expect(String(clonedContextValue)).toEqual(contextStringBeforeLog);
    expect(clonedContextValue.size()).toEqual(0);
  });
});
