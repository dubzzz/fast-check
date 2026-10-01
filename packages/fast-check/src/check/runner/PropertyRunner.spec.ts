import { describe, expect, it, vi } from 'vitest';
import { nil } from '../../utils/iterator.js';
import { Value } from '../arbitrary/definition/Value.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';
import { VerbosityLevel } from './configuration/VerbosityLevel.js';
import { propertyRunner } from './PropertyRunner.js';
import { RunnerIterator } from './RunnerIterator.js';
import { SourceValuesIterator } from './SourceValuesIterator.js';

type RunResult = Awaited<ReturnType<Property<number>['run']>>;

function buildRunner(values: number[]) {
  const initialValues = values.map((value) => new Value(value, undefined)).values();
  const sourceValues = new SourceValuesIterator(initialValues, values.length, values.length);
  const runner = new RunnerIterator(sourceValues, () => nil, VerbosityLevel.None);
  vi.spyOn(runner, 'next');
  vi.spyOn(runner, 'handleResult');
  return runner;
}

describe('propertyRunner', () => {
  it('Should return the execution synchronously when there are no values', () => {
    const runner = buildRunner([]);
    const run = vi.fn(() => null);

    expect(propertyRunner(runner, run)).toBe(runner.runExecution);
    expect(run).not.toHaveBeenCalled();
    expect(runner.handleResult).not.toHaveBeenCalled();
  });

  it('Should return the execution synchronously and handle every synchronous result in order', () => {
    const results: RunResult[] = [null, new PreconditionFailure(), { error: new Error('failure') }];
    const runner = buildRunner([0, 1, 2]);
    const run = vi.fn((value: number) => results[value]);

    expect(propertyRunner(runner, run)).toBe(runner.runExecution);
    expect(run.mock.calls).toEqual([[0], [1], [2]]);
    expect(vi.mocked(runner.handleResult).mock.calls).toEqual(results.map((result) => [result]));
    expect(runner.runExecution.numSuccesses).toBe(1);
    expect(runner.runExecution.numSkips).toBe(1);
    expect(runner.runExecution.failure).toBe(results[2]);
  });

  it.each([0, 1, 2])('Should return a promise when result %i is asynchronous', async (asyncIndex) => {
    const results: RunResult[] = [null, new PreconditionFailure(), { error: new Error('failure') }];
    const runner = buildRunner([0, 1, 2]);
    const run = vi.fn((value: number) => (value === asyncIndex ? Promise.resolve(results[value]) : results[value]));

    const out = propertyRunner(runner, run);

    expect(out).toBeInstanceOf(Promise);
    await expect(out).resolves.toBe(runner.runExecution);
    expect(run.mock.calls).toEqual([[0], [1], [2]]);
    expect(vi.mocked(runner.handleResult).mock.calls).toEqual(results.map((result) => [result]));
    expect(runner.runExecution.numSuccesses).toBe(1);
    expect(runner.runExecution.numSkips).toBe(1);
    expect(runner.runExecution.failure).toBe(results[2]);
  });

  it('Should execute each consecutive synchronous segment in the same microtask', async () => {
    const firstPending = Promise.withResolvers<RunResult>();
    const secondPending = Promise.withResolvers<RunResult>();
    const runner = buildRunner([0, 1, 2, 3, 4, 5, 6, 7]);
    const run = vi.fn((value: number) => {
      if (value === 2) return firstPending.promise;
      if (value === 5) return secondPending.promise;
      return null;
    });

    const out = propertyRunner(runner, run);

    expect(run.mock.calls).toEqual([[0], [1], [2]]);
    expect(runner.next).toHaveBeenCalledTimes(3);
    expect(runner.handleResult).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    expect(runner.next).toHaveBeenCalledTimes(3);
    expect(runner.handleResult).toHaveBeenCalledTimes(2);

    firstPending.resolve(null);
    await Promise.resolve();
    expect(run.mock.calls).toEqual([[0], [1], [2], [3], [4], [5]]);
    expect(runner.next).toHaveBeenCalledTimes(6);
    expect(runner.handleResult).toHaveBeenCalledTimes(5);

    secondPending.resolve(null);
    await Promise.resolve();
    expect(run.mock.calls).toEqual([[0], [1], [2], [3], [4], [5], [6], [7]]);
    expect(runner.handleResult).toHaveBeenCalledTimes(8);
    await expect(out).resolves.toBe(runner.runExecution);
  });

  it('Should handle each result before requesting the next value', async () => {
    const runner = buildRunner([0, 1, 2]);
    const next = runner.next.bind(runner);
    runner.next = vi.fn(() => {
      expect(runner.handleResult).toHaveBeenCalledTimes(vi.mocked(runner.next).mock.calls.length - 1);
      return next();
    });
    const run = (value: number) => (value === 1 ? Promise.resolve(null) : null);

    await expect(propertyRunner(runner, run)).resolves.toBe(runner.runExecution);
    expect(runner.handleResult).toHaveBeenCalledTimes(3);
  });

  it('Should propagate a rejected result without advancing or handling it', async () => {
    const error = new Error('rejected run');
    const runner = buildRunner([0, 1]);

    await expect(propertyRunner(runner, () => Promise.reject(error))).rejects.toBe(error);
    expect(runner.next).toHaveBeenCalledTimes(1);
    expect(runner.handleResult).not.toHaveBeenCalled();
  });

  it('Should propagate synchronous errors synchronously', () => {
    const error = new Error('thrown run');
    const runner = buildRunner([0, 1]);
    const run = () => {
      throw error;
    };

    expect(() => propertyRunner(runner, run)).toThrow(error);
    expect(runner.next).toHaveBeenCalledTimes(1);
    expect(runner.handleResult).not.toHaveBeenCalled();
  });

  it('Should reject if a synchronous run throws after an asynchronous result', async () => {
    const error = new Error('thrown run');
    const runner = buildRunner([0, 1, 2]);
    const run = (value: number) => {
      if (value === 0) return Promise.resolve(null);
      throw error;
    };

    await expect(propertyRunner(runner, run)).rejects.toBe(error);
    expect(runner.next).toHaveBeenCalledTimes(2);
    expect(vi.mocked(runner.handleResult).mock.calls).toEqual([[null]]);
  });
});
