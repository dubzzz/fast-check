import { AssertionError, deepStrictEqual } from 'node:assert';
import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';

describe('defaultReporter', () => {
  it.each([false, true])(
    'should expose the final assertion values with an asynchronous predicate: %s',
    async (isAsync) => {
      // Arrange
      let lastError: unknown;
      const predicate = (value: number) => {
        try {
          deepStrictEqual({ value }, { value: -1 });
        } catch (error) {
          lastError = error;
          throw error;
        }
      };

      // Act
      const out = fc.assert(fc.property(fc.nat(), isAsync ? async (value) => predicate(value) : predicate), {
        seed: 42,
        examples: [[100]],
        noDefaultPlugins: true,
        plugins: [fc.defaultReporter({ includeActualAndExpected: true })],
      });

      // Assert
      await expect(out).rejects.toMatchObject({
        message: expect.stringContaining('Counterexample: [0]'),
        actual: { value: 0 },
        expected: { value: -1 },
        cause: { actual: { value: 0 }, expected: { value: -1 } },
      });
      await expect(out).rejects.toHaveProperty('cause', lastError);
      await out.catch((error) => {
        expect(error.cause).toBe(lastError);
        expect(error.actual).toBe(error.cause.actual);
        expect(error.expected).toBe(error.cause.expected);
      });
    },
  );

  it.each([undefined, false])('should leave assertion values on the cause when the flag is %s', async (flag) => {
    // Arrange
    const error = new AssertionError({ actual: 1, expected: 2, operator: 'strictEqual' });

    // Act
    const out = reportError(error, flag === undefined ? {} : { includeActualAndExpected: flag });

    // Assert
    await expect(out).rejects.toHaveProperty('cause', error);
    await expect(out).rejects.not.toHaveProperty('actual');
    await expect(out).rejects.not.toHaveProperty('expected');
  });

  it.each([
    { actual: { value: 1 }, expected: { value: 2 } },
    { actual: undefined, expected: null },
    { actual: false, expected: 0 },
    { actual: '', expected: undefined },
  ])('should preserve assertion values and the original frozen error: %j', async ({ actual, expected }) => {
    // Arrange
    const error = Object.freeze(new AssertionError({ actual, expected, operator: 'deepStrictEqual' }));

    // Act
    const out = reportError(error, { includeActualAndExpected: true });

    // Assert
    await expect(out).rejects.toHaveProperty('actual', actual);
    await expect(out).rejects.toHaveProperty('expected', expected);
    await out.catch((reportedError) => {
      expect(reportedError.cause).toBe(error);
      expect(reportedError.actual).toBe(actual);
      expect(reportedError.expected).toBe(expected);
    });
    expect(error.actual).toBe(actual);
    expect(error.expected).toBe(expected);
  });

  it.each([
    null,
    undefined,
    'failure',
    42,
    false,
    Symbol('failure'),
    new Error('failure'),
    { actual: 1 },
    { expected: 2 },
  ])('should not add assertion values when the thrown value has no complete pair: %s', async (error) => {
    // Act
    const out = reportError(error, { includeActualAndExpected: true });

    // Assert
    await expect(out).rejects.toHaveProperty('cause', error);
    await expect(out).rejects.not.toHaveProperty('actual');
    await expect(out).rejects.not.toHaveProperty('expected');
  });

  it('should expose inherited and non-enumerable assertion values on a thrown object', async () => {
    // Arrange
    const error = Object.defineProperty(Object.create({ actual: 1 }), 'expected', { value: 2 });

    // Act
    const out = reportError(error, { includeActualAndExpected: true });

    // Assert
    await expect(out).rejects.toMatchObject({ actual: 1, expected: 2, cause: error });
  });

  it('should expose assertion values when the counterexample requires asynchronous stringification', async () => {
    // Arrange
    const error = new AssertionError({ actual: 1, expected: 2, operator: 'strictEqual' });

    // Act
    const out = fc.assert(
      fc.property(fc.constant({ [fc.asyncToStringMethod]: async () => 'custom value' }), () => {
        throw error;
      }),
      { noDefaultPlugins: true, plugins: [fc.defaultReporter({ includeActualAndExpected: true })] },
    );

    // Assert
    await expect(out).rejects.toMatchObject({
      message: expect.stringContaining('Counterexample: [custom value]'),
      actual: 1,
      expected: 2,
      cause: error,
    });
  });

  it('should expose assertion values when including the original error in the message', async () => {
    // Arrange
    const error = new AssertionError({ actual: 1, expected: 2, operator: 'strictEqual' });

    // Act
    const out = reportError(error, { includeActualAndExpected: true, includeErrorInReport: true });

    // Assert
    await expect(out).rejects.toMatchObject({
      message: expect.stringContaining(error.message),
      actual: 1,
      expected: 2,
    });
    await expect(out).rejects.not.toHaveProperty('cause');
    expect(error.actual).toBe(1);
    expect(error.expected).toBe(2);
  });

  it('should expose assertion values from plugin setup failures', async () => {
    // Arrange
    const error = new AssertionError({ actual: 1, expected: 2, operator: 'strictEqual' });

    // Act
    const out = fc.assert(
      fc.property(fc.constant(null), () => true),
      {
        noDefaultPlugins: true,
        plugins: [
          () => ({
            beforeAll: () => {
              throw error;
            },
          }),
          fc.defaultReporter({ includeActualAndExpected: true }),
        ],
      },
    );

    // Assert
    await expect(out).rejects.toMatchObject({
      message: expect.stringContaining('Property could not start because plugin setup failed'),
      actual: 1,
      expected: 2,
      cause: error,
    });
  });
});

// Helpers

function reportError(error: unknown, options: fc.DefaultReporterOptions): Promise<void> {
  return fc.assert(
    fc.property(fc.constant(null), () => {
      throw error;
    }),
    { noDefaultPlugins: true, plugins: [fc.defaultReporter(options)] },
  );
}
