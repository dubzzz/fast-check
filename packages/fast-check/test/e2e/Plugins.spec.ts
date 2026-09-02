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

  it('should not delay the resolution of check when every onAllRunsComplete and afterAll is synchronous', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string, onLast?: () => void): fc.Plugin<[number]> => {
      return () => {
        return {
          onAllRunsComplete: () => {
            probes.push(`${pluginName}::onAllRunsComplete`);
          },
          afterAll: () => {
            probes.push(`${pluginName}::afterAll`);
            if (onLast !== undefined) {
              onLast();
            }
          },
        };
      };
    };
    const queueTicksProbes = () => {
      // a::afterAll runs last: from there, count how many microtask ticks elapse before check resolves
      Promise.resolve()
        .then(() => probes.push('tick1'))
        .then(() => probes.push('tick2'))
        .then(() => probes.push('tick3'))
        .then(() => probes.push('tick4'));
    };

    // Act
    await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => true),
      { plugins: [buildPlugin('a', queueTicksProbes), buildPlugin('b')] },
    );
    probes.push('check resolved');
    await new Promise((resolve) => setTimeout(resolve)); // flush pending ticks

    // Assert
    // Fully synchronous hooks must not requeue anything: check resolves on the very next tick
    expect(probes).toEqual([
      'a::onAllRunsComplete',
      'b::onAllRunsComplete',
      'b::afterAll',
      'a::afterAll',
      'tick1',
      'check resolved',
      'tick2',
      'tick3',
      'tick4',
    ]);
  });

  it('should not delay the rejection of check when synchronous hooks throw and only forward the first error', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string, onLast?: () => void): fc.Plugin<[number]> => {
      return () => {
        return {
          onAllRunsComplete: () => {
            probes.push(`${pluginName}::onAllRunsComplete`);
            throw new Error(`error from ${pluginName}::onAllRunsComplete`);
          },
          afterAll: () => {
            probes.push(`${pluginName}::afterAll`);
            if (onLast !== undefined) {
              onLast();
            }
            throw new Error(`error from ${pluginName}::afterAll`);
          },
        };
      };
    };
    const queueTicksProbes = () => {
      // a::afterAll runs last: from there, count how many microtask ticks elapse before check rejects
      Promise.resolve()
        .then(() => probes.push('tick1'))
        .then(() => probes.push('tick2'))
        .then(() => probes.push('tick3'))
        .then(() => probes.push('tick4'));
    };

    // Act
    let intercepted: unknown = undefined;
    try {
      await fc.check(
        fc.asyncProperty(fc.integer(), async (_x) => true),
        { plugins: [buildPlugin('a', queueTicksProbes), buildPlugin('b'), buildPlugin('c')] },
      );
    } catch (error) {
      intercepted = error;
      probes.push('check rejected');
    }
    await new Promise((resolve) => setTimeout(resolve)); // flush pending ticks

    // Assert
    expect(intercepted).toEqual(new Error('error from a::onAllRunsComplete'));
    // Fully synchronous hooks must not requeue anything: check rejects on the very next tick
    expect(probes).toEqual([
      'a::onAllRunsComplete',
      'b::onAllRunsComplete',
      'c::onAllRunsComplete',
      'c::afterAll',
      'b::afterAll',
      'a::afterAll',
      'tick1',
      'check rejected',
      'tick2',
      'tick3',
      'tick4',
    ]);
  });

  it('should chain synchronous hooks within the same tick when following an asynchronous one', async () => {
    // Arrange
    const probes: string[] = [];
    const asyncPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: async () => {
        probes.push('a::onAllRunsComplete');
      },
    });
    const buildSyncPlugin = (pluginName: string): fc.Plugin<[number]> => {
      return () => {
        return {
          onAllRunsComplete: () => {
            probes.push(`${pluginName}::onAllRunsComplete`);
            if (pluginName === 'b') {
              // Anything requeued between b and c would run before this one
              void Promise.resolve().then(() => probes.push('tick queued by b'));
            }
          },
        };
      };
    };

    // Act
    await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => true),
      { plugins: [asyncPlugin, buildSyncPlugin('b'), buildSyncPlugin('c')] },
    );

    // Assert
    // Once the asynchronous hook resolved, b and c run back-to-back within the same tick
    expect(probes).toEqual([
      'a::onAllRunsComplete',
      'b::onAllRunsComplete',
      'c::onAllRunsComplete',
      'tick queued by b',
    ]);
  });

  it('should not accumulate extra ticks per asynchronous hook in a chain of asynchronous hooks', async () => {
    // Arrange
    const probes: string[] = [];
    const asyncPlugin = (): fc.Plugin<[number]> => () => ({
      onAllRunsComplete: async () => undefined,
      afterAll: async () => undefined,
    });
    const lastPlugin: fc.Plugin<[number]> = () => ({
      onAllRunsComplete: async () => undefined,
      afterAll: () => {
        // afterAll of the first plugin runs last: when its promise settles, count how many
        // microtask ticks elapse before check resolves
        const out = Promise.resolve();
        void out.then(() => {
          let chain = Promise.resolve();
          for (let tick = 1; tick <= 8; ++tick) {
            chain = chain.then(() => void probes.push(`tick${tick}`));
          }
        });
        return out;
      },
    });

    // Act
    await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => true),
      { plugins: [lastPlugin, asyncPlugin(), asyncPlugin()] },
    );
    probes.push('check resolved');
    await new Promise((resolve) => setTimeout(resolve)); // flush pending ticks

    // Assert
    // The tick count separating the last hook from the resolution of check must not depend
    // on how many asynchronous hooks ran before it
    expect(probes).toEqual(['tick1', 'tick2', 'check resolved', 'tick3', 'tick4', 'tick5', 'tick6', 'tick7', 'tick8']);
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
