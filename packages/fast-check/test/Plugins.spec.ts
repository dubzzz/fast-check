import { describe, expect, it, vi } from 'vitest';
import * as fc from '../src/fast-check.js';
import { seed } from './seed.js';

describe(`Plugins (seed: ${seed})`, () => {
  it('should wait and queue beforeAll, onAllRunsComplete and afterAll', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          beforeAll: async () => {
            probes.push(`${pluginName}::beforeAll started`);
            await Promise.resolve(`${pluginName}1`);
            await Promise.resolve(`${pluginName}2`);
            probes.push(`${pluginName}::beforeAll done`);
          },
          onAllRunsComplete: async () => {
            probes.push(`${pluginName}::onAllRunsComplete started`);
            await Promise.resolve(`${pluginName}1`);
            await Promise.resolve(`${pluginName}2`);
            await Promise.resolve(`${pluginName}3`);
            probes.push(`${pluginName}::onAllRunsComplete done`);
          },
          afterAll: async () => {
            probes.push(`${pluginName}::afterAll started`);
            await Promise.resolve(`${pluginName}1`);
            await Promise.resolve(`${pluginName}2`);
            await Promise.resolve(`${pluginName}3`);
            probes.push(`${pluginName}::afterAll done`);
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate');
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'a::beforeAll started',
      'a::beforeAll done',
      'b::beforeAll started',
      'b::beforeAll done',
      'predicate',
      'predicate',
      'a::onAllRunsComplete started',
      'a::onAllRunsComplete done',
      'b::onAllRunsComplete started',
      'b::onAllRunsComplete done',
      'b::afterAll started',
      'b::afterAll done',
      'a::afterAll started',
      'a::afterAll done',
      'assert done',
    ]);
  });

  it('should keep synchronous setup and runs synchronous', async () => {
    // Arrange
    const probes: string[] = [];
    const plugin: fc.Plugin<[number]> = () => ({
      beforeAll: () => {
        probes.push('beforeAll');
      },
      afterAll: () => {
        probes.push('afterAll');
      },
    });

    // Act
    const assertion = fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate');
      }),
      { plugins: [plugin], numRuns: 2 },
    );

    // Assert
    expect(probes).toEqual(['beforeAll', 'predicate', 'predicate', 'afterAll']);
    await assertion;
  });

  it.each([{ isAsync: false }, { isAsync: true }])(
    'should run beforeAll once per assertion, including shrinking (async: $isAsync)',
    async ({ isAsync }) => {
      // Arrange
      const beforeAll = vi.fn(() => (isAsync ? Promise.resolve() : undefined));
      const predicate = vi.fn((_x: number) => false);
      const property = fc.property(fc.integer({ min: 1, max: 100 }), predicate);
      const plugin: fc.Plugin<[number]> = () => ({ beforeAll });

      // Act
      for (let index = 0; index !== 2; ++index) {
        await fc.assert<[number]>(property, { plugins: [plugin], examples: [[100]], noDefaultPlugins: true });
        expect(beforeAll).toHaveBeenCalledTimes(index + 1);
      }

      // Assert
      expect(predicate.mock.calls.length).toBeGreaterThan(2);
    },
  );

  it('should run beforeAll and afterAll even when no runs are requested', async () => {
    // Arrange
    const beforeAll = vi.fn();
    const afterAll = vi.fn();
    const predicate = vi.fn();

    // Act
    await fc.assert(fc.property(fc.integer(), predicate), {
      plugins: [() => ({ beforeAll, afterAll })],
      numRuns: 0,
    });

    // Assert
    expect(beforeAll).toHaveBeenCalledOnce();
    expect(afterAll).toHaveBeenCalledOnce();
    expect(predicate).not.toHaveBeenCalled();
  });

  it.each([
    { asyncFirst: false, asyncFailure: false },
    { asyncFirst: false, asyncFailure: true },
    { asyncFirst: true, asyncFailure: false },
    { asyncFirst: true, asyncFailure: true },
  ])(
    'should run all setup hooks and report the first failure without teardown (async first: $asyncFirst, async failure: $asyncFailure)',
    async ({ asyncFirst, asyncFailure }) => {
      // Arrange
      const probes: string[] = [];
      const error = new Error('setup failed');
      const onAllRunsComplete = vi.fn((_details: fc.RunDetails<[number]>) => {
        probes.push('onAllRunsComplete');
      });
      const afterAll = vi.fn();
      const decorateGenerate = vi.fn((nested) => nested);
      const decorateRun = vi.fn((nested) => nested);
      const predicate = vi.fn();
      const pluginA: fc.Plugin<[number]> = () => ({
        beforeAll: () => {
          probes.push('a::beforeAll');
          return asyncFirst ? Promise.resolve() : undefined;
        },
        afterAll,
        onAllRunsComplete,
        decorateGenerate,
        decorateRun,
      });
      const pluginB: fc.Plugin<[number]> = () => ({
        beforeAll: () => {
          probes.push('b::beforeAll');
          if (asyncFailure) {
            return Promise.reject(error);
          }
          throw error;
        },
        afterAll,
        onAllRunsComplete,
      });
      const pluginC: fc.Plugin<[number]> = () => ({
        beforeAll: async () => {
          probes.push('c::beforeAll started');
          await Promise.resolve();
          probes.push('c::beforeAll done');
          throw new Error('later setup failure');
        },
        afterAll,
        onAllRunsComplete,
      });

      // Act
      const assertion = fc.assert(fc.property(fc.integer(), predicate), {
        plugins: [pluginA, pluginB, pluginC],
        seed: 42,
        path: '0:0',
        numRuns: 10,
        verbose: fc.VerbosityLevel.VeryVerbose,
      });

      // Assert
      await expect(assertion).rejects.toMatchObject({
        message: expect.stringContaining('Property setup failed in beforeAll'),
        cause: error,
      });
      expect(probes).toEqual([
        'a::beforeAll',
        'b::beforeAll',
        'c::beforeAll started',
        'c::beforeAll done',
        'onAllRunsComplete',
        'onAllRunsComplete',
        'onAllRunsComplete',
      ]);
      expect(onAllRunsComplete).toHaveBeenCalledTimes(3);
      const runDetails = onAllRunsComplete.mock.calls[0][0];
      expect(runDetails).toEqual({
        failed: true,
        interrupted: false,
        numRuns: 0,
        numSkips: 0,
        numShrinks: 0,
        seed: 42,
        counterexample: null,
        counterexamplePath: null,
        errorInstance: error,
        failures: [],
        executionSummary: [],
        verbose: fc.VerbosityLevel.VeryVerbose,
        runConfiguration: expect.objectContaining({
          seed: 42,
          path: '0:0',
          numRuns: 10,
          verbose: fc.VerbosityLevel.VeryVerbose,
        }),
      });
      expect(runDetails.errorInstance).toBe(error);
      for (const [reported] of onAllRunsComplete.mock.calls) {
        expect(reported).toBe(runDetails);
      }
      expect(afterAll).not.toHaveBeenCalled();
      expect(decorateGenerate).not.toHaveBeenCalled();
      expect(decorateRun).not.toHaveBeenCalled();
      expect(predicate).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, 0, false])('should preserve a falsy beforeAll error (%s)', async (error) => {
    // Arrange
    const afterAll = vi.fn();
    const onAllRunsComplete = vi.fn<(_details: fc.RunDetails<[number]>) => void>();

    // Act / Assert
    await expect(
      fc.assert(
        fc.property(fc.integer(), () => true),
        {
          plugins: [
            () => ({
              beforeAll: () => {
                throw error;
              },
              onAllRunsComplete,
              afterAll,
            }),
          ],
        },
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Property setup failed in beforeAll'),
      cause: error,
    });
    expect(onAllRunsComplete).toHaveBeenCalledOnce();
    expect(onAllRunsComplete.mock.calls[0][0].errorInstance).toBe(error);
    expect(afterAll).not.toHaveBeenCalled();
  });

  it.each([0, 5])('should let reporters handle setup failures with noDefaultPlugins (numRuns: %s)', async (numRuns) => {
    // Arrange
    const error = new Error('setup failed');
    const predicate = vi.fn();
    const onAllRunsComplete = vi.fn<(_details: fc.RunDetails<[number]>) => void>();
    const afterAll = vi.fn();

    // Act / Assert
    await expect(
      fc.assert(fc.property(fc.integer(), predicate), {
        numRuns,
        noDefaultPlugins: true,
        plugins: [
          () => ({
            beforeAll: () => {
              throw error;
            },
            onAllRunsComplete,
            afterAll,
          }),
        ],
      }),
    ).resolves.toBeUndefined();
    expect(onAllRunsComplete).toHaveBeenCalledOnce();
    expect(onAllRunsComplete.mock.calls[0][0]).toMatchObject({ failed: true, numRuns: 0, errorInstance: error });
    expect(predicate).not.toHaveBeenCalled();
    expect(afterAll).not.toHaveBeenCalled();
  });

  it('should finish all setup-failure reporters and forward the first reporting error', async () => {
    // Arrange
    const setupError = new Error('setup failed');
    const reportingError = new Error('custom report');
    const probes: string[] = [];
    const afterAll = vi.fn();

    // Act / Assert
    await expect(
      fc.assert(
        fc.property(fc.integer(), () => true),
        {
          plugins: [
            () => ({
              beforeAll: () => {
                throw setupError;
              },
              onAllRunsComplete: async (details) => {
                expect(details.errorInstance).toBe(setupError);
                probes.push('first started');
                await Promise.resolve();
                probes.push('first done');
                throw reportingError;
              },
              afterAll,
            }),
            () => ({
              onAllRunsComplete: (details) => {
                expect(details.errorInstance).toBe(setupError);
                probes.push('second');
                throw new Error('later reporting failure');
              },
              afterAll,
            }),
          ],
        },
      ),
    ).rejects.toBe(reportingError);
    expect(probes).toEqual(['first started', 'first done', 'second']);
    expect(afterAll).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'should respect includeErrorInReport for setup failures (%s)',
    async (includeErrorInReport) => {
      // Arrange
      const error = new Error('setup failed');

      // Act
      const assertion = fc.assert(
        fc.property(fc.integer(), () => true),
        {
          seed: 42,
          verbose: fc.VerbosityLevel.VeryVerbose,
          noDefaultPlugins: true,
          plugins: [
            () => ({
              beforeAll: () => {
                throw error;
              },
            }),
            fc.defaultReporter({ includeErrorInReport }),
          ],
        },
      );

      // Assert
      await expect(assertion).rejects.toMatchObject({
        message: expect.stringContaining('Property setup failed in beforeAll\n{ seed: 42 }\n\nRan 0 time(s)'),
      });
      if (includeErrorInReport) {
        await expect(assertion).rejects.toThrow('Got error: setup failed');
        await expect(assertion).rejects.not.toHaveProperty('cause');
      } else {
        await expect(assertion).rejects.toHaveProperty('cause', error);
        await expect(assertion).rejects.not.toThrow('Got error:');
      }
      await expect(assertion).rejects.not.toThrow('pre-condition');
      await expect(assertion).rejects.not.toThrow('Counterexample:');
    },
  );

  it('should run every onAllRunsComplete and afterAll even when many throw and only forward the first error', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        return {
          onAllRunsComplete: async () => {
            probes.push(`${pluginName}::onAllRunsComplete`);
            throw new Error(`error from ${pluginName}::onAllRunsComplete`);
          },
          afterAll: async () => {
            probes.push(`${pluginName}::afterAll`);
            throw new Error(`error from ${pluginName}::afterAll`);
          },
        };
      };
    };

    // Act / Assert
    await expect(
      fc.assert(
        fc.property(fc.integer(), async (_x) => true),
        { plugins: [buildPlugin('a'), buildPlugin('b'), buildPlugin('c')] },
      ),
    ).rejects.toThrow(/^error from a::onAllRunsComplete$/);
    expect(probes).toEqual([
      'a::onAllRunsComplete',
      'b::onAllRunsComplete',
      'c::onAllRunsComplete',
      'c::afterAll',
      'b::afterAll',
      'a::afterAll',
    ]);
  });

  it('should forward afterAll errors when no onAllRunsComplete reported an error', async () => {
    // Arrange
    // Disable default reporting so no completion hook reports the predicate failure before afterAll.
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      afterAll: () => {
        throw new Error(`boom!`);
      },
    });

    // Act / Assert
    await expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed, noDefaultPlugins: true },
      ),
    ).rejects.toThrow(/^boom!$/);
  });

  it('should give plugins the ability to replace the default reporting of assert via onAllRunsComplete', async () => {
    // Arrange
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: (runDetails) => {
        if (runDetails.failed) {
          throw new Error(`Custom report for counterexample ${JSON.stringify(runDetails.counterexample)}`);
        }
      },
    });

    // Act / Assert
    await expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
      ),
    ).rejects.toThrow(/^Custom report for counterexample \[42\]$/);
  });

  it('should preserve the default reporting of assert when onAllRunsComplete does not throw', async () => {
    // Arrange
    const seenFailures: boolean[] = [];
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: (runDetails) => {
        seenFailures.push(runDetails.failed);
      },
    });

    // Act / Assert
    await expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
      ),
    ).rejects.toThrow(/Property failed after/);
    expect(seenFailures).toEqual([true]);
  });

  it('should stack decorateGenerate in declaration order then run the predicate', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          decorateGenerate:
            (nestedGenerate) =>
            (...args) => {
              probes.push(`${pluginName}::generate started`);
              const out = nestedGenerate(...args);
              probes.push(`${pluginName}::generate done`);
              return out;
            },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'a::generate started',
      'b::generate started',
      'b::generate done',
      'a::generate done',
      'predicate called',
      'a::generate started',
      'b::generate started',
      'b::generate done',
      'a::generate done',
      'predicate called',
      'assert done',
    ]);
  });

  it('should stack decorateRun with the first plugin being the closest to the predicate', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          decorateRun: (nestedRun) => (value, executionContext) => {
            probes.push(`${pluginName}::run started`);
            try {
              return nestedRun(value, executionContext);
            } finally {
              probes.push(`${pluginName}::run done`);
            }
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
      'assert done',
    ]);
  });

  it('should await decorateRun of asynchronous plugins', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        return {
          asyncOnly: true,
          decorateRun: (nestedRun) => async (value, executionContext) => {
            probes.push(`${pluginName}::run started`);
            await Promise.resolve();
            const out = await nestedRun(value, executionContext);
            await Promise.resolve();
            probes.push(`${pluginName}::run done`);
            return out;
          },
        };
      };
    };

    // Act
    await fc.assert(
      fc.property(fc.integer(), async (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );

    // Assert
    expect(probes).toEqual([
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
      'a::run started',
      'b::run started',
      'predicate called',
      'b::run done',
      'a::run done',
    ]);
  });

  it.each([
    { hook: 'beforeAll' as const, expectReversed: false },
    { hook: 'afterAll' as const, expectReversed: true },
    { hook: 'onAllRunsComplete' as const, expectReversed: false },
  ])('should support mixes of sync and async $hook', async ({ hook, expectReversed }) => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string, isAsync: boolean): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          [hook]: isAsync
            ? async () => {
                probes.push(`${pluginName}::${hook} started`);
                await Promise.resolve(`${pluginName}1`);
                await Promise.resolve(`${pluginName}2`);
                await Promise.resolve(`${pluginName}3`);
                probes.push(`${pluginName}::${hook} done`);
              }
            : () => {
                probes.push(`${pluginName}::${hook} started`);
                probes.push(`${pluginName}::${hook} done`);
              },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.property(fc.integer(), async (_x) => true),
      {
        plugins: [
          buildPlugin('a', false),
          buildPlugin('b', true),
          buildPlugin('c', false),
          buildPlugin('d', false),
          buildPlugin('e', true),
        ],
      },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'c instantiated',
      'd instantiated',
      'e instantiated',
      ...(expectReversed ? ['e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e']).flatMap((id) => [
        `${id}::${hook} started`,
        `${id}::${hook} done`,
      ]),
      'assert done',
    ]);
  });

  it('should apply plugins functions in precise order', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (): fc.Plugin<[number]> => {
      return () => {
        probes.push(`plugin: instantiated`);
        return {
          beforeAll: () => {
            probes.push(`plugin: beforeAll`);
          },
          decorateGenerate: (nested) => {
            probes.push(`plugin: decorateGenerate`);
            return (...args) => {
              probes.push(`plugin: generate`);
              return nested(...args);
            };
          },
          decorateRun: (nested) => {
            probes.push(`plugin: decorateRun`);
            return (...args) => {
              probes.push(`plugin: run`);
              return nested(...args);
            };
          },
          onAllRunsComplete: () => {
            probes.push(`plugin: onAllRunsComplete`);
          },
          afterAll: () => {
            probes.push(`plugin: afterAll`);
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate');
        return true;
      }),
      { plugins: [buildPlugin()], numRuns: 2 },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'plugin: instantiated', // prepare phase
      'plugin: beforeAll',
      'plugin: decorateGenerate',
      'plugin: decorateRun',
      'plugin: generate', // 1st run
      'plugin: run',
      'predicate',
      'plugin: generate', // 2nd run
      'plugin: run',
      'predicate',
      'plugin: onAllRunsComplete', // clean-up
      'plugin: afterAll',
      'assert done',
    ]);
  });
});
