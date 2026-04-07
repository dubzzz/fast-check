import { describe, it, expect } from 'vitest';
import { AbortedProperty } from '../../../../src/check/property/AbortedProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import { fakeProperty } from './__test-helpers__/PropertyHelpers.js';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';

describe('AbortedProperty', () => {
  it('should forward call to isAsync', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.isAsync();

    // Assert
    expect(isAsync).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward call to generate', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();
    const { instance: mrng } = fakeRandom();

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.generate(mrng, 123);

    // Assert
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward call to shrink', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.shrink(new Value(Symbol('value'), Symbol('context')));

    // Assert
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward call to run when signal is not aborted', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, run } = fakeProperty(false);

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.run(Symbol('value'));

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('should forward call to runBeforeEach', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, runBeforeEach } = fakeProperty();

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.runBeforeEach();

    // Assert
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
  });

  it('should forward call to runAfterEach', () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, runAfterEach } = fakeProperty();

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    p.runAfterEach();

    // Assert
    expect(runAfterEach).toHaveBeenCalledTimes(1);
  });

  it('should return a PreconditionFailure with interrupt when signal is already aborted (sync)', () => {
    // Arrange
    const abortController = new AbortController();
    abortController.abort();
    const { instance: decoratedProperty, run } = fakeProperty(false);

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    const out = p.run(Symbol('value'));

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    expect(run).not.toHaveBeenCalled();
  });

  it('should return a PreconditionFailure with interrupt when signal is already aborted (async)', async () => {
    // Arrange
    const abortController = new AbortController();
    abortController.abort();
    const { instance: decoratedProperty, run } = fakeProperty(true);

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    const out = await p.run(Symbol('value'));

    // Assert
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    expect(run).not.toHaveBeenCalled();
  });

  it('should interrupt async run when signal is aborted during execution', async () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockReturnValueOnce(
      new Promise((resolve) => {
        setTimeout(() => resolve(null), 1000);
      }),
    );

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    const runPromise = p.run(Symbol('value'));
    abortController.abort();

    // Assert
    const out = await runPromise;
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });

  it('should return property result if it completes before abort (async)', async () => {
    // Arrange
    const abortController = new AbortController();
    const { instance: decoratedProperty, run } = fakeProperty(true);
    run.mockResolvedValueOnce(null);

    // Act
    const p = new AbortedProperty(decoratedProperty, abortController.signal);
    const out = await p.run(Symbol('value'));

    // Assert
    expect(out).toBe(null);
  });
});
