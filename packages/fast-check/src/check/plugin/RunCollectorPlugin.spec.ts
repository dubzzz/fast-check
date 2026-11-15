import { describe, expect, it, vi } from 'vitest';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';
import { runCollector } from './RunCollectorPlugin.js';

describe('RunCollectorPlugin', () => {
  describe.each([false, true])('with an asynchronous predicate: %s', (isAsync) => {
    it('should forward inputs and collect successful runs', async () => {
      // Arrange
      const value = Symbol('value');
      const context = { signal: new AbortController().signal };
      const onCollect = vi.fn();
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(isAsync ? Promise.resolve(null) : null);
      const finalRun = collectorRun(onCollect, true, nestedRun);

      // Act
      const out = isAsync ? await finalRun(value, context) : finalRun(value, context);

      // Assert
      expect(out).toBeNull();
      expect(nestedRun).toHaveBeenCalledExactlyOnceWith(value, context);
      expect(onCollect).toHaveBeenCalledExactlyOnceWith(value);
    });

    it('should collect failing runs and translate failures into interrupts', async () => {
      // Arrange
      const value = Symbol('value');
      const failure = { error: new Error('failure') };
      const onCollect = vi.fn();
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(isAsync ? Promise.resolve(failure) : failure);
      const finalRun = collectorRun(onCollect, true, nestedRun);

      // Act
      const out = isAsync ? await finalRun(value, {}) : finalRun(value, {});

      // Assert
      expect(PreconditionFailure.isFailure(out) && out.interruptExecution).toBe(true);
      expect(onCollect).toHaveBeenCalledExactlyOnceWith(value);
    });

    it('should report collection errors as failures', async () => {
      const error = new Error('collection failed');
      const onCollect = () => {
        throw error;
      };
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(isAsync ? Promise.resolve(null) : null);
      const finalRun = collectorRun(onCollect, true, nestedRun);

      const out = isAsync ? await finalRun(Symbol('value'), {}) : finalRun(Symbol('value'), {});

      expect(out).toEqual({ error });
    });

    it.each([
      { name: 'skips', result: new PreconditionFailure() },
      { name: 'interrupts', result: new PreconditionFailure(true) },
    ])('should forward $name unchanged without collecting', async ({ result }) => {
      // Arrange
      const onCollect = vi.fn();
      const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(isAsync ? Promise.resolve(result) : result);
      const finalRun = collectorRun(onCollect, true, nestedRun);

      // Act
      const out = isAsync ? await finalRun(Symbol('value'), {}) : finalRun(Symbol('value'), {});

      // Assert
      expect(out).toBe(result);
      expect(onCollect).not.toHaveBeenCalled();
    });
  });

  it('should wait for an asynchronous predicate before collecting', async () => {
    // Arrange
    const value = Symbol('value');
    const { promise, resolve } = Promise.withResolvers<null>();
    const onCollect = vi.fn();
    const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue(promise);
    const finalRun = collectorRun(onCollect, true, nestedRun);

    // Act
    const out = finalRun(value, {});

    // Assert
    expect(onCollect).not.toHaveBeenCalled();
    resolve(null);
    expect(await out).toBeNull();
    expect(onCollect).toHaveBeenCalledExactlyOnceWith(value);
  });

  it('should collect without running the predicate when disabled', () => {
    // Arrange
    const value = Symbol('value');
    const onCollect = vi.fn();
    const nestedRun = vi.fn<Property<unknown>['run']>().mockReturnValue({ error: new Error('failure') });
    const finalRun = collectorRun(onCollect, false, nestedRun);

    // Act
    const out = finalRun(value, {});

    // Assert
    expect(out).toBeNull();
    expect(nestedRun).not.toHaveBeenCalled();
    expect(onCollect).toHaveBeenCalledExactlyOnceWith(value);
  });
});

function collectorRun(onCollect: (value: unknown) => void, runPredicate: boolean, nestedRun: Property<unknown>['run']) {
  const instance = runCollector(onCollect, runPredicate)(0, new Map());
  return instance.decorateRun!(nestedRun);
}
