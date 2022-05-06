import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe('TimeoutProperty', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should forward calls to generate', () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, generate } = fakeProperty(true);
    const { instance: mrng } = fakeRandom();
    const expectedRunId = 42;
    const expectedOut = new NextValue(Symbol('value'), Symbol('context'));
    generate.mockReturnValueOnce(expectedOut);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    const out = timeoutProp.generate(mrng, expectedRunId);

    // Assert
    expect(out).toBe(expectedOut);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, expectedRunId);
  });

  it('should forward inputs to run', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    const expectedRunInput = { anything: Symbol('something') };

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
    const runPromise = timeoutProp.run(expectedRunInput);
    jest.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(expectedRunInput);
  });

  it('should not timeout if it succeeds in time', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 10);
      })
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(await runPromise).toBe(null);
  });

  it('should not timeout if it fails in time', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        // underlying property is not supposed to throw (reject)
        setTimeout(() => resolve('plop'), 10);
      })
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(await runPromise).toBe('plop');
  });

  it('should clear all started timeouts on success', async () => {
    // Arrange
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce(null);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    await timeoutProp.run({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should clear all started timeouts on failure', async () => {
    // Arrange
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce('plop');

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    await timeoutProp.run({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should timeout if it takes to long', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        setTimeout(() => resolve(null), 100);
      })
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual(`Property timeout: exceeded limit of 10 milliseconds`);
  });

  it('Should timeout if it never ends', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(new Promise(() => {}));

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual(`Property timeout: exceeded limit of 10 milliseconds`);
  });
});
