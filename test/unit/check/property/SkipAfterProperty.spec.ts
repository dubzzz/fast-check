import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';

const startTimeMs = 200;
const timeLimitMs = 100;

describe('SkipAfterProperty', () => {
  it('should call timer at construction', async () => {
    // Arrange
    const timerMock = jest.fn();
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    new SkipAfterProperty(decoratedProperty, timerMock, 0, false);

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
  });

  it('should not call timer on isAsync but forward call', async () => {
    // Arrange
    const timerMock = jest.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    p.isAsync();

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should not call timer on generate but forward call', async () => {
    // Arrange
    const timerMock = jest.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run } = fakeProperty();
    const { instance: mrng } = fakeRandom();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    p.generate(mrng, 123);

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should not call timer on shrink but forward call', async () => {
    // Arrange
    const timerMock = jest.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    p.shrink(new NextValue(Symbol('value'), Symbol('context')));

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();
  });

  it('should call timer on run and forward call if ok', () => {
    // Arrange
    const timerMock = jest.fn();
    const { instance: decoratedProperty, isAsync, generate, shrink, run } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    p.run(Symbol('value'));

    // Assert
    expect(timerMock).toHaveBeenCalledTimes(2);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('should call timer on run and fail after time limit', () => {
    // Arrange
    const timerMock = jest
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty, isAsync, generate, shrink, run } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    const out = p.run(Symbol('value'));

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(timerMock).toHaveBeenCalledTimes(2);
    expect(isAsync).toHaveBeenCalledTimes(1); // check expected return type: return a resolved Promise if async, a value otherwise
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should forward falsy interrupt flag to the precondition failure', async () => {
    // Arrange
    const timerMock = jest
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, false);
    const out = p.run(Symbol('value'));

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(false);
  });

  it('should forward truthy interrupt flag to the precondition failure', () => {
    // Arrange
    const timerMock = jest
      .fn()
      .mockReturnValueOnce(startTimeMs)
      .mockReturnValueOnce(startTimeMs + timeLimitMs);
    const { instance: decoratedProperty } = fakeProperty();

    // Act
    const p = new SkipAfterProperty(decoratedProperty, timerMock, 0, true);
    const out = p.run(Symbol('value'));

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });
});
