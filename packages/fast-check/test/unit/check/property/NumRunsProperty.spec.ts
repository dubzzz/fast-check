import { describe, it, expect } from 'vitest';
import { NumRunsProperty } from '../../../../src/check/property/NumRunsProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import { fakeProperty } from './__test-helpers__/PropertyHelpers.js';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';

describe('NumRunsProperty', () => {
  it('should forward isAsync to the underlying property', () => {
    // Arrange
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new NumRunsProperty(decoratedProperty, 5);
    p.isAsync();

    // Assert
    expect(isAsync).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward generate to the underlying property', () => {
    // Arrange
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();
    const { instance: mrng } = fakeRandom();

    // Act
    const p = new NumRunsProperty(decoratedProperty, 5);
    p.generate(mrng, 42);

    // Assert
    expect(generate).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(shrink).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward shrink to the underlying property', () => {
    // Arrange
    const { instance: decoratedProperty, isAsync, generate, shrink, run, runBeforeEach, runAfterEach } = fakeProperty();

    // Act
    const p = new NumRunsProperty(decoratedProperty, 5);
    p.shrink(new Value(Symbol('value'), Symbol('context')));

    // Assert
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(isAsync).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(runAfterEach).not.toHaveBeenCalled();
  });

  it('should forward runBeforeEach to the underlying property', () => {
    // Arrange
    const { instance: decoratedProperty, runBeforeEach, runAfterEach, run } = fakeProperty();

    // Act
    const p = new NumRunsProperty(decoratedProperty, 5);
    p.runBeforeEach();

    // Assert
    expect(runBeforeEach).toHaveBeenCalledTimes(1);
    expect(runAfterEach).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should forward runAfterEach to the underlying property', () => {
    // Arrange
    const { instance: decoratedProperty, runBeforeEach, runAfterEach, run } = fakeProperty();

    // Act
    const p = new NumRunsProperty(decoratedProperty, 5);
    p.runAfterEach();

    // Assert
    expect(runAfterEach).toHaveBeenCalledTimes(1);
    expect(runBeforeEach).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('should forward run to the underlying property within budget', () => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeProperty(false);
    run.mockReturnValue(null);

    // Act
    const p = new NumRunsProperty(decoratedProperty, 3);
    const results = [p.run(Symbol('v1')), p.run(Symbol('v2')), p.run(Symbol('v3'))];

    // Assert
    expect(run).toHaveBeenCalledTimes(3);
    expect(results).toEqual([null, null, null]);
  });

  it('should return PreconditionFailure with interruptExecution once budget is exhausted', () => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeProperty(false);
    run.mockReturnValue(null);

    // Act
    const p = new NumRunsProperty(decoratedProperty, 2);
    p.run(Symbol('v1'));
    p.run(Symbol('v2'));
    const out = p.run(Symbol('v3'));

    // Assert
    expect(run).toHaveBeenCalledTimes(2);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });

  it('should not count skipped runs toward the budget', () => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeProperty(false);
    const skip = new PreconditionFailure(false);
    run
      .mockReturnValueOnce(null) // success #1
      .mockReturnValueOnce(skip) // skip — not counted
      .mockReturnValueOnce(null) // success #2
      .mockReturnValueOnce(skip) // skip — not counted
      .mockReturnValueOnce(null); // success #3

    // Act
    const p = new NumRunsProperty(decoratedProperty, 3);
    const results = [];
    for (let i = 0; i < 5; ++i) {
      results.push(p.run(Symbol(`v${i}`)));
    }
    const out = p.run(Symbol('extra'));

    // Assert
    expect(run).toHaveBeenCalledTimes(5);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });

  it('should not interrupt during shrinking after a property failure', () => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeProperty(false);
    const failure = { error: new Error('property failed') };
    run
      .mockReturnValueOnce(null) // success
      .mockReturnValueOnce(failure) // PropertyFailure → enters shrinking
      .mockReturnValueOnce(null) // shrink run — should still delegate
      .mockReturnValueOnce(failure) // shrink run — should still delegate
      .mockReturnValueOnce(null); // shrink run — should still delegate

    // Act
    const p = new NumRunsProperty(decoratedProperty, 2);
    const r1 = p.run(Symbol('v1')); // success, budget 1→0
    const r2 = p.run(Symbol('v2')); // failure, enters shrinking
    const r3 = p.run(Symbol('s1')); // in shrinking, delegates
    const r4 = p.run(Symbol('s2')); // in shrinking, delegates
    const r5 = p.run(Symbol('s3')); // in shrinking, delegates

    // Assert
    expect(run).toHaveBeenCalledTimes(5);
    expect(r1).toBe(null);
    expect(r2).toBe(failure);
    expect(r3).toBe(null);
    expect(r4).toBe(failure);
    expect(r5).toBe(null);
  });

  it('should handle numRuns of 0 by immediately interrupting', () => {
    // Arrange
    const { instance: decoratedProperty, run } = fakeProperty(false);

    // Act
    const p = new NumRunsProperty(decoratedProperty, 0);
    const out = p.run(Symbol('v1'));

    // Assert
    expect(run).not.toHaveBeenCalled();
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
  });

  describe('async property', () => {
    it('should forward run and resolve within budget', async () => {
      // Arrange
      const { instance: decoratedProperty, run } = fakeProperty(true);
      run.mockResolvedValue(null);

      // Act
      const p = new NumRunsProperty(decoratedProperty, 2);
      const r1 = await p.run(Symbol('v1'));
      const r2 = await p.run(Symbol('v2'));

      // Assert
      expect(run).toHaveBeenCalledTimes(2);
      expect(r1).toBe(null);
      expect(r2).toBe(null);
    });

    it('should return resolved PreconditionFailure once budget is exhausted', async () => {
      // Arrange
      const { instance: decoratedProperty, run } = fakeProperty(true);
      run.mockResolvedValue(null);

      // Act
      const p = new NumRunsProperty(decoratedProperty, 1);
      await p.run(Symbol('v1'));
      const out = await p.run(Symbol('v2'));

      // Assert
      expect(run).toHaveBeenCalledTimes(1);
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it('should not count async skipped runs toward the budget', async () => {
      // Arrange
      const { instance: decoratedProperty, run } = fakeProperty(true);
      const skip = new PreconditionFailure(false);
      run
        .mockResolvedValueOnce(null) // success
        .mockResolvedValueOnce(skip) // skip
        .mockResolvedValueOnce(null); // success

      // Act
      const p = new NumRunsProperty(decoratedProperty, 2);
      await p.run(Symbol('v1'));
      await p.run(Symbol('v2'));
      await p.run(Symbol('v3'));
      const out = await p.run(Symbol('v4'));

      // Assert
      expect(run).toHaveBeenCalledTimes(3);
      expect(PreconditionFailure.isFailure(out)).toBe(true);
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
    });

    it('should not interrupt during async shrinking after a property failure', async () => {
      // Arrange
      const { instance: decoratedProperty, run } = fakeProperty(true);
      const failure = { error: new Error('property failed') };
      run
        .mockResolvedValueOnce(failure) // failure → enters shrinking
        .mockResolvedValueOnce(null) // shrink run
        .mockResolvedValueOnce(failure); // shrink run

      // Act
      const p = new NumRunsProperty(decoratedProperty, 1);
      const r1 = await p.run(Symbol('v1'));
      const r2 = await p.run(Symbol('s1'));
      const r3 = await p.run(Symbol('s2'));

      // Assert
      expect(run).toHaveBeenCalledTimes(3);
      expect(r1).toBe(failure);
      expect(r2).toBe(null);
      expect(r3).toBe(failure);
    });
  });
});
