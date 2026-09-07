import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

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
      fc.asyncProperty(fc.integer(), async (_x) => true),
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
        fc.asyncProperty(fc.integer(), async (_x) => true),
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

  it('should forward errors thrown within afterAll to the user even in case of predicate failure', () => {
    // Arrange
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      afterAll: () => {
        throw new Error(`boom!`);
      },
    });

    // Act / Assert
    expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
      ),
    ).toThrow(/^boom!$/);
  });

  it('should give plugins the ability to replace the default reporting of assert via onAllRunsComplete', () => {
    // Arrange
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: (runDetails) => {
        if (runDetails.failed) {
          throw new Error(`Custom report for counterexample ${JSON.stringify(runDetails.counterexample)}`);
        }
      },
    });

    // Act / Assert
    expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
      ),
    ).toThrow(/^Custom report for counterexample \[42\]$/);
  });

  it('should preserve the default reporting of assert when onAllRunsComplete does not throw', () => {
    // Arrange
    const seenFailures: boolean[] = [];
    const reporterPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: (runDetails) => {
        seenFailures.push(runDetails.failed);
      },
    });

    // Act / Assert
    expect(() =>
      fc.assert(
        fc.property(fc.integer(), (x) => x < 42),
        { plugins: [reporterPlugin], seed },
      ),
    ).toThrow(/Property failed after/);
    expect(seenFailures).toEqual([true]);
  });

  it('should stack decorateRun with the first plugin being the closest to the predicate', () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          decorateRun: (nestedRun) => (value) => {
            probes.push(`${pluginName}::run started`);
            try {
              return nestedRun(value);
            } finally {
              probes.push(`${pluginName}::run done`);
            }
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    fc.assert(
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
          decorateRun: (nestedRun) => async (value) => {
            probes.push(`${pluginName}::run started`);
            await Promise.resolve();
            const out = await nestedRun(value);
            await Promise.resolve();
            probes.push(`${pluginName}::run done`);
            return out;
          },
        };
      };
    };

    // Act
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (_x) => {
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
      fc.asyncProperty(fc.integer(), async (_x) => true),
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
});
