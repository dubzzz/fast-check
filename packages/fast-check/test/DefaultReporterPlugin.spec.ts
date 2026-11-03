import { describe, expect, expectTypeOf, it } from 'vitest';
import * as fc from '../src/fast-check.js';

describe('DefaultReporterPlugin', () => {
  it('should support any property value type', () => {
    expectTypeOf(fc.defaultReporter()).toEqualTypeOf<fc.UniversalPlugin>();
    expectTypeOf(fc.defaultReporter()).toExtend<fc.Plugin<[number, string]>>();
  });

  it.each([
    { name: 'synchronous', predicate: () => true },
    { name: 'asynchronous', predicate: () => Promise.resolve(true) },
  ])('should leave successful $name runs unchanged', async ({ predicate }) => {
    await expect(
      fc.assert(fc.property(fc.nat(), predicate), {
        noDefaultPlugins: true,
        plugins: [fc.defaultReporter()],
      }),
    ).resolves.toBeUndefined();
  });

  it('should restore default failure reporting when default plugins are disabled', async () => {
    const failure = new Error('original failure');
    const property = fc.property(fc.constant('value'), () => {
      throw failure;
    });

    await expect(() =>
      fc.assert(property, { seed: 42, noDefaultPlugins: true, plugins: [fc.defaultReporter()] }),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'Property failed after 1 tests\n{ seed: 42, path: "0", endOnFailure: true }\nCounterexample: ["value"]\nShrunk 0 time(s)',
      ),
      cause: failure,
    });
  });

  it('should report too many skipped runs', async () => {
    const property = fc.property(fc.nat(), () => fc.pre(false));

    await expect(() =>
      fc.assert(property, {
        numRuns: 1,
        maxSkipsPerRun: 1,
        noDefaultPlugins: true,
        plugins: [fc.defaultReporter()],
      }),
    ).rejects.toThrow('Failed to run property, too many pre-condition failures encountered');
  });

  it('should opt check into failure reporting when explicitly passed', async () => {
    const property = fc.property(fc.constant(42), () => false);

    await expect(fc.check(property)).resolves.toMatchObject({ failed: true });
    await expect(() => fc.check(property, { plugins: [fc.defaultReporter()] })).rejects.toThrow('Counterexample: [42]');
  });

  it('should await asynchronous counterexample formatting before cleanup', async () => {
    const steps: string[] = [];
    const value = {
      [fc.asyncToStringMethod]: () =>
        Promise.resolve().then(() => {
          steps.push('stringify');
          return 'formatted-value';
        }),
    };
    const cleanupPlugin: fc.UniversalPlugin = () => ({
      afterAll: () => {
        steps.push('cleanup');
      },
    });

    await expect(() =>
      fc.assert(
        fc.property(fc.constant(value), () => false),
        {
          noDefaultPlugins: true,
          plugins: [fc.defaultReporter(), cleanupPlugin],
        },
      ),
    ).rejects.toThrow('Counterexample: [formatted-value]');
    expect(steps).toEqual(['stringify', 'cleanup']);
  });

  it.each([true, false])(
    'should preserve the first reported error and run all hooks (default reporter first: %s)',
    async (defaultReporterFirst) => {
      const steps: string[] = [];
      const customReporter: fc.UniversalPlugin = () => ({
        onAllRunsComplete: () => {
          steps.push('custom report');
          throw new Error('custom failure');
        },
        afterAll: () => {
          steps.push('cleanup');
        },
      });
      const plugins = defaultReporterFirst
        ? [fc.defaultReporter(), customReporter]
        : [customReporter, fc.defaultReporter()];

      await expect(() =>
        fc.assert(
          fc.property(fc.constant(42), () => false),
          { noDefaultPlugins: true, plugins },
        ),
      ).rejects.toThrow(defaultReporterFirst ? 'Property failed after 1 tests' : 'custom failure');
      expect(steps).toEqual(['custom report', 'cleanup']);
    },
  );
});
