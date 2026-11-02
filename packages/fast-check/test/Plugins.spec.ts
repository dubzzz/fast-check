import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';
import { seed } from './seed.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';

describe(`Plugins (seed: ${seed})`, () => {
  it('should wait and queue onAllRunsComplete and afterAll', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
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
      fc.property(fc.integer(), async (_x) => true),
      { plugins: [buildPlugin('a'), buildPlugin('b')] },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
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

  it('should preserve global and local plugins and await their callbacks with noDefaultPlugins', async () => {
    // Arrange
    const probes: string[] = [];
    const seenRunDetails: unknown[] = [];
    const buildPlugin =
      (name: string): fc.UniversalPlugin =>
      () => {
        probes.push(`${name} instantiated`);
        return {
          decorateRun: (nestedRun) => (value, context) => {
            probes.push(`${name}::run`);
            return nestedRun(value, context);
          },
          onAllRunsComplete: async (runDetails) => {
            await Promise.resolve();
            probes.push(`${name}::onAllRunsComplete`);
            seenRunDetails.push(runDetails);
          },
          afterAll: async () => {
            await Promise.resolve();
            probes.push(`${name}::afterAll`);
          },
        };
      };
    const globalPlugins = readInstalledGlobalPlugins();
    const initialGlobalPluginCount = globalPlugins.length;
    fc.installGlobalPlugin(buildPlugin('global'));

    try {
      // Act
      const out = await fc.assert(
        fc.property(fc.constant(42), () => false),
        {
          noDefaultPlugins: true,
          plugins: [buildPlugin('local')],
        },
      );
      probes.push('assert done');

      // Assert
      expect(out).toBeUndefined();
      expect(seenRunDetails).toHaveLength(2);
      expect(seenRunDetails[0]).toMatchObject({ failed: true, counterexample: [42] });
      expect(seenRunDetails[1]).toBe(seenRunDetails[0]);
      expect(probes).toEqual([
        'global instantiated',
        'local instantiated',
        'global::run',
        'local::run',
        'global::onAllRunsComplete',
        'local::onAllRunsComplete',
        'local::afterAll',
        'global::afterAll',
        'assert done',
      ]);
    } finally {
      globalPlugins.splice(initialGlobalPluginCount);
    }
  });

  it.each([false, true])(
    'should run every onAllRunsComplete and afterAll even when many throw and only forward the first error (noDefaultPlugins=%s)',
    async (noDefaultPlugins) => {
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
          { noDefaultPlugins, plugins: [buildPlugin('a'), buildPlugin('b'), buildPlugin('c')] },
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
    },
  );

  it('should forward errors thrown within afterAll to the user even in case of predicate failure', async () => {
    // Arrange
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      afterAll: () => {
        throw new Error(`boom!`);
      },
    });

    // Act / Assert
    await expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
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
          buildPlugin('a', true),
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
