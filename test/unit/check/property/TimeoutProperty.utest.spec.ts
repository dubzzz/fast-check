import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';

import * as stubRng from '../../stubs/generators';
const mrng = () => stubRng.mutable.nocall();

jest.useFakeTimers();

describe('TimeoutProperty', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('Should forward calls to generate', () => {
    // Arrange
    const expectedMrng = mrng();
    const expectedRunId = 42;
    const expectedOut = new Shrinkable({});
    const p: IRawProperty<number> = {
      isAsync: () => true,
      generate: jest.fn().mockReturnValueOnce(expectedOut),
      run: jest.fn(),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 100);
    const out = timeoutProp.generate(expectedMrng, expectedRunId);

    // Assert
    expect(out).toBe(expectedOut);
    expect(p.generate).toBeCalledTimes(1);
    expect(p.generate).toBeCalledWith(expectedMrng, expectedRunId);
  });

  it('Should forward inputs to run', async () => {
    // Arrange
    const runInput = {};
    const p: IRawProperty<typeof runInput> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn(),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 10);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);
    await runPromise;

    // Assert
    expect(p.run).toHaveBeenCalledTimes(1);
    expect(p.run).toHaveBeenCalledWith(runInput);
  });

  it('Should not timeout if it succeeds in time', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockReturnValueOnce(
        new Promise(function (resolve) {
          setTimeout(() => resolve(null), 10);
        })
      ),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 100);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toBe(null);
  });

  it('Should not timeout if it fails in time', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockReturnValueOnce(
        new Promise(function (resolve) {
          // underlying property is not supposed to throw (reject)
          setTimeout(() => resolve('plop'), 10);
        })
      ),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 100);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual('plop');
  });

  it('Should clear all started timeouts on success', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockResolvedValueOnce(null),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 100);
    await timeoutProp.run({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('Should clear all started timeouts on failure', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockResolvedValueOnce('plop'),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 100);
    await timeoutProp.run({});

    // Assert
    expect(setTimeout).toBeCalledTimes(1);
    expect(clearTimeout).toBeCalledTimes(1);
  });

  it('Should timeout if it takes to long', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockReturnValueOnce(
        new Promise(function (resolve) {
          setTimeout(() => resolve(null), 100);
        })
      ),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 10);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual(`Property timeout: exceeded limit of 10 milliseconds`);
  });

  it('Should timeout if it never ends', async () => {
    // Arrange
    const p: IRawProperty<unknown> = {
      isAsync: () => true,
      generate: jest.fn(),
      run: jest.fn().mockReturnValueOnce(new Promise(() => {})),
    };

    // Act
    const timeoutProp = new TimeoutProperty(p, 10);
    const runPromise = timeoutProp.run({});
    jest.advanceTimersByTime(10);

    // Assert
    expect(await runPromise).toEqual(`Property timeout: exceeded limit of 10 milliseconds`);
  });
});
