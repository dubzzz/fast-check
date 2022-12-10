import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';
import { fakeProperty } from './__test-helpers__/PropertyHelpers';

describe.each([[true], [false]])('TimeoutProperty (dontRunHook: %p)', (dontRunHook) => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should forward calls to generate', () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, generate } = fakeProperty(true);
    const { instance: mrng } = fakeRandom();
    const expectedRunId = 42;
    const expectedOut = new Value(Symbol('value'), Symbol('context'));
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
    const { instance: decoratedProperty, run, runBeforeEach, runAfterEach } = fakeProperty(true);
    const expectedRunInput = { anything: Symbol('something') };

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      const runPromise = timeoutProp.run(expectedRunInput, true);
      jest.advanceTimersByTime(10);
      await runPromise;
      await timeoutProp.runAfterEach!();
    } else {
      const runPromise = timeoutProp.run(expectedRunInput, false);
      jest.advanceTimersByTime(10);
      await runPromise;
    }

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(expectedRunInput, dontRunHook);
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
    expect(runAfterEach).toHaveBeenCalledTimes(1);
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
    let runPromise: ReturnType<typeof timeoutProp.run>;
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      runPromise = timeoutProp.run({}, true);
      jest.advanceTimersByTime(10);
      await runPromise;
      await timeoutProp.runAfterEach!();
    } else {
      runPromise = timeoutProp.run({}, false);
      jest.advanceTimersByTime(10);
      await runPromise;
    }

    // Assert
    expect(await runPromise).toBe(null);
  });

  if (dontRunHook) {
    it('should not timeout if it succeeds in time while timeout in beforeEach', async () => {
      // Arrange
      jest.useFakeTimers();
      const { instance: decoratedProperty, runBeforeEach } = fakeProperty(true);
      runBeforeEach.mockReturnValueOnce(
        new Promise(function (resolve) {
          setTimeout(() => resolve(), 100);
        })
      );

      // Act / After
      const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
      const beforeEachPromise = timeoutProp.runBeforeEach!();
      jest.advanceTimersByTime(100);
      await beforeEachPromise;
      await timeoutProp.run({}, true);
      await timeoutProp.runAfterEach!();
    });

    it('should not timeout if it succeeds in time while timeout in afterEach', async () => {
      // Arrange
      jest.useFakeTimers();
      const { instance: decoratedProperty, runAfterEach } = fakeProperty(true);
      runAfterEach.mockReturnValueOnce(
        new Promise(function (resolve) {
          setTimeout(() => resolve(), 100);
        })
      );

      // Act / Assert
      const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
      await timeoutProp.runBeforeEach!();
      await timeoutProp.run({}, true);
      const afterEachPromise = timeoutProp.runAfterEach!();
      jest.advanceTimersByTime(100);
      await afterEachPromise;
    });
  }

  it('should not timeout if it fails in time', async () => {
    // Arrange
    const errorFromUnderlying = { error: undefined, errorMessage: 'plop' };
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise(function (resolve) {
        // underlying property is not supposed to throw (reject)
        setTimeout(() => resolve(errorFromUnderlying), 10);
      })
    );

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    let runPromise: ReturnType<typeof timeoutProp.run>;
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      runPromise = timeoutProp.run({}, true);
      jest.advanceTimersByTime(10);
      await runPromise;
      await timeoutProp.runAfterEach!();
    } else {
      runPromise = timeoutProp.run({}, false);
      jest.advanceTimersByTime(10);
      await runPromise;
    }

    // Assert
    expect(await runPromise).toBe(errorFromUnderlying);
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
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      await timeoutProp.run({}, true);
      await timeoutProp.runAfterEach!();
    } else {
      await timeoutProp.run({}, false);
    }

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('should clear all started timeouts on failure', async () => {
    // Arrange
    const errorFromUnderlying = { error: undefined, errorMessage: 'plop' };
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce(errorFromUnderlying);

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 100);
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      await timeoutProp.run({}, true);
      await timeoutProp.runAfterEach!();
    } else {
      await timeoutProp.run({}, false);
    }

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
    let runPromise: ReturnType<typeof timeoutProp.run>;
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      runPromise = timeoutProp.run({}, true);
    } else {
      runPromise = timeoutProp.run({}, false);
    }
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({
      error: expect.any(Error),
      errorMessage: `Property timeout: exceeded limit of 10 milliseconds`,
    });
    await timeoutProp.runAfterEach!();
  });

  it('Should timeout if it never ends', async () => {
    // Arrange
    jest.useFakeTimers();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(new Promise(() => {}));

    // Act
    const timeoutProp = new TimeoutProperty(decoratedProperty, 10);
    let runPromise: ReturnType<typeof timeoutProp.run>;
    if (dontRunHook) {
      await timeoutProp.runBeforeEach!();
      runPromise = timeoutProp.run({}, true);
    } else {
      runPromise = timeoutProp.run({}, false);
    }
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual({
      error: expect.any(Error),
      errorMessage: `Property timeout: exceeded limit of 10 milliseconds`,
    });
    await timeoutProp.runAfterEach!();
  });
});
