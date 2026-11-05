import { describe, expect, it, vi } from 'vitest';
import { nil } from '../../../utils/iterator.js';
import { Value } from '../../arbitrary/definition/Value.js';
import { PreconditionFailure } from '../../precondition/PreconditionFailure.js';
import type { Property } from '../../property/types/Property.js';
import { read } from '../configuration/QualifiedParameters.js';
import { createRunnerIterator } from './RunnerIteratorBuilder.js';

describe('createRunnerIterator', () => {
  it.each([
    { path: '', numRuns: 0 },
    { path: '', numRuns: 3 },
    { path: '2', numRuns: 0 },
    { path: '2', numRuns: 3 },
  ])('should stop generating after $numRuns runs for path "$path"', ({ path, numRuns }) => {
    // Arrange
    const property = buildProperty();
    const iterator = createRunnerIterator(property, property, read({ path, numRuns }), 100);

    // Act
    for (let index = 0; index !== numRuns; ++index) {
      expect(iterator.next()).toEqual({ done: false, value: 42 });
      iterator.handleResult(null);
    }

    // Assert
    expect(iterator.next().done).toBe(true);
    expect(iterator.next().done).toBe(true);
    expect(property.generate).toHaveBeenCalledTimes(numRuns);
  });

  it('should replace skipped initial values before reaching numRuns', () => {
    // Arrange
    const property = buildProperty();
    const iterator = createRunnerIterator(property, property, read({ numRuns: 2 }), 100);

    // Act
    for (const result of [new PreconditionFailure(), null, new PreconditionFailure(), null]) {
      expect(iterator.next().done).toBe(false);
      iterator.handleResult(result);
    }

    // Assert
    expect(iterator.next().done).toBe(true);
    expect(property.generate).toHaveBeenCalledTimes(4);
    expect(iterator.runExecution.numSuccesses).toBe(2);
    expect(iterator.runExecution.numSkips).toBe(2);
  });

  it('should keep shrinking beyond numRuns after the last initial value fails', () => {
    // Arrange
    const property = buildProperty(function* () {
      yield new Value(2, undefined);
      yield new Value(1, undefined);
      yield new Value(0, undefined);
    });
    const iterator = createRunnerIterator(property, property, read({ numRuns: 2 }), 100);

    // Act
    expect(iterator.next().done).toBe(false);
    iterator.handleResult(null);
    expect(iterator.next().done).toBe(false);
    iterator.handleResult({ error: new Error('failure') });
    for (const value of [2, 1, 0]) {
      expect(iterator.next()).toEqual({ done: false, value });
      iterator.handleResult(null);
    }

    // Assert
    expect(iterator.next().done).toBe(true);
    expect(property.generate).toHaveBeenCalledTimes(2);
  });

  it('should consume all remaining shrinks when replaying a path containing a colon', () => {
    // Arrange
    const property = buildProperty(function* () {
      yield new Value(2, undefined);
      yield new Value(1, undefined);
      yield new Value(0, undefined);
    });
    const iterator = createRunnerIterator(property, property, read({ path: '2:0', numRuns: 1 }), 100);

    // Act
    for (const value of [2, 1, 0]) {
      expect(iterator.next()).toEqual({ done: false, value });
      iterator.handleResult(null);
    }

    // Assert
    expect(iterator.next().done).toBe(true);
    expect(property.generate).toHaveBeenCalledTimes(1);
  });

  it.each([
    { reason: 'interruption', result: new PreconditionFailure(true), maxSkips: 100 },
    { reason: 'too many skips', result: new PreconditionFailure(), maxSkips: 0 },
  ])('should not generate another value after $reason', ({ result, maxSkips }) => {
    // Arrange
    const property = buildProperty();
    const iterator = createRunnerIterator(property, property, read({ numRuns: 2 }), maxSkips);

    // Act
    expect(iterator.next().done).toBe(false);
    iterator.handleResult(result);

    // Assert
    expect(iterator.next().done).toBe(true);
    expect(property.generate).toHaveBeenCalledTimes(1);
  });
});

// Helpers

function buildProperty(shrink: Property<number>['shrink'] = () => nil) {
  return {
    generate: vi.fn(() => new Value(42, undefined)),
    shrink,
    run: () => null,
  } satisfies Property<number>;
}
