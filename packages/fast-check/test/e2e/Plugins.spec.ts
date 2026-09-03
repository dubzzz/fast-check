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

  it('should stack decorateRun with the last plugin being the closest to the predicate', () => {
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

  it('should instantiate plugins in order, wrap every execution and run onAllRunsComplete then afterAll in the documented order', async () => {
    const seenStores = new Set<fc.PluginStore>();
    await fc.assert(
      fc.asyncProperty(
        pluginBatchArbitrary('never throwing'),
        fc.array(fc.constantFrom<Outcome>('success', 'skip', 'failure'), { maxLength: 4 }),
        fc.integer({ min: 0, max: 3 }),
        fc.constantFrom(0, 100),
        fc.boolean(),
        async ({ isAsyncProperty, pluginConfigs }, outcomes, numRuns, maxSkipsPerRun, useAssert) => {
          // Arrange
          const probes: string[] = [];
          const instantiations: { pluginIndex: number; pluginStore: fc.PluginStore }[] = [];
          const seenRunDetails: (fc.RunDetails<[number]> | undefined)[] = [];
          const plugins = pluginConfigs.map(
            (config, index) =>
              probingPluginFor(`#${index}`, config, isAsyncProperty, {
                probe: (label) => probes.push(label),
                onInstantiate: (pluginIndex, pluginStore) => instantiations.push({ pluginIndex, pluginStore }),
                onAllRunsComplete: (runDetails) => seenRunDetails.push(runDetails),
              }).plugin,
          );
          let numExecutions = 0;
          const predicate = () => {
            probes.push('predicate called');
            const outcome = outcomes[numExecutions++] ?? 'success'; // exhausted script means success
            if (outcome === 'skip') {
              fc.pre(false);
            }
            if (outcome === 'failure') {
              throw new Error('predicate failure');
            }
          };

          // Act
          const { out, thrown } = await runWithPlugins({
            isAsyncProperty,
            arbitrary: fc.noShrink(fc.nat()),
            predicate,
            plugins,
            useAssert,
            numRuns,
            maxSkipsPerRun,
          });

          // Assert
          expect(instantiations.map((i) => i.pluginIndex)).toEqual(pluginConfigs.map((_, index) => index));
          expect(new Set(instantiations.map((i) => i.pluginStore)).size).toBe(1); // one store shared by all plugins...
          expect(seenStores.has(instantiations[0].pluginStore)).toBe(false); // ...but a new one for each run
          seenStores.add(instantiations[0].pluginStore);
          expect(probes).toEqual(expectedProbesFor(pluginConfigs, numExecutions));
          // The run stops at the first failure (no shrink) or at the first skip when none are allowed
          const stopper = outcomes
            .slice(0, numExecutions)
            .find((outcome) => outcome === 'failure' || (outcome === 'skip' && maxSkipsPerRun === 0));
          if (useAssert) {
            expect(out).toBe(undefined);
            if (stopper === undefined) {
              expect(thrown).toBe(undefined);
            } else {
              expect((thrown as Error).message).toMatch(
                stopper === 'failure' ? /^Property failed after/ : /^Failed to run property, too many pre-condition/,
              );
            }
          } else {
            expect(thrown).toBe(undefined);
            expect(out!.failed).toBe(stopper !== undefined);
            expect(out!.numRuns + out!.numSkips).toBe(numExecutions);
            for (const runDetails of seenRunDetails) {
              expect(runDetails).toBe(out);
            }
          }
        },
      ),
      { seed },
    );
  });

  it('should run every onAllRunsComplete and afterAll in the documented order and forward the first error in call order whatever the mix of throwing hooks', async () => {
    await fc.assert(
      fc.asyncProperty(
        pluginBatchArbitrary('throwing at least once'),
        fc.boolean(),
        fc.boolean(),
        async ({ isAsyncProperty, pluginConfigs }, predicateFails, useAssert) => {
          // Arrange
          const probes: string[] = [];
          const plugins = pluginConfigs.map((config, index) =>
            probingPluginFor(`#${index}`, config, isAsyncProperty, { probe: (label) => probes.push(label) }),
          );
          let numExecutions = 0;
          const predicate = () => {
            probes.push('predicate called');
            ++numExecutions;
            if (predicateFails) {
              throw new Error('predicate failure');
            }
          };

          // Act
          const { thrown } = await runWithPlugins({
            isAsyncProperty,
            arbitrary: fc.noShrink(fc.nat()),
            predicate,
            plugins: plugins.map((p) => p.plugin),
            useAssert,
            numRuns: 2,
          });

          // Assert
          expect(numExecutions).toBe(predicateFails ? 1 : 2);
          expect(probes).toEqual(expectedProbesFor(pluginConfigs, numExecutions));
          expect(thrown).toBe(firstThrownErrorFor(plugins));
        },
      ),
      { seed },
    );
  });

  it('should report the outcome computed by the outermost decorateRun', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.array(fc.constantFrom<WrapperMode>('forward', 'recover', 'fail'), { minLength: 1, maxLength: 3 }),
        fc.boolean(),
        async (isAsyncProperty, modes, predicateFails) => {
          // Arrange
          const predicateError = new Error('predicate failure');
          const seenValues: number[] = [];
          const wrappers = modes.map((mode, index) => wrappingPluginFor(mode, isAsyncProperty, new Error(`#${index}`)));
          const predicate = (value: number) => {
            seenValues.push(value);
            if (predicateFails) {
              throw predicateError;
            }
          };

          // Act
          const { out } = await runWithPlugins({
            isAsyncProperty,
            arbitrary: fc.integer(),
            predicate,
            plugins: wrappers.map((w) => w.plugin),
            useAssert: false,
            numRuns: 2,
          });

          // Assert
          let outcome: fc.PropertyFailure | null = predicateFails ? { error: predicateError } : null;
          const expectedNestedOutcomes: (fc.PropertyFailure | null)[] = [];
          for (let index = modes.length - 1; index >= 0; --index) {
            expectedNestedOutcomes[index] = outcome;
            outcome =
              modes[index] === 'forward'
                ? outcome
                : modes[index] === 'recover'
                  ? null
                  : { error: wrappers[index].error };
          }
          expect(out!.failed).toBe(outcome !== null);
          expect(out!.errorInstance).toBe(outcome !== null ? outcome.error : null);
          if (outcome !== null) {
            expect(out!.numRuns).toBe(1); // failed on first run...
            expect(seenValues.length).toBe(1 + out!.numShrinks); // ...then all shrunk values failed too
          } else {
            expect(out!.numRuns).toBe(2);
            expect(seenValues.length).toBe(2);
          }
          for (let index = 0; index !== wrappers.length; ++index) {
            const wrapper = wrappers[index];
            expect(wrapper.seenValues).toEqual(seenValues); // wraps every execution, including shrinking ones
            expect(wrapper.seenAsyncNestedRuns).toEqual(seenValues.map(() => isAsyncProperty));
            expect(wrapper.seenNestedOutcomes).toEqual(seenValues.map(() => expectedNestedOutcomes[index]));
          }
        },
      ),
      { seed },
    );
  });
});

// Helpers

function delay0() {
  return new Promise((r) => setTimeout(r, 0));
}

async function microtasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

type HookKind = 'none' | 'sync' | 'async';
type CompletionHookConfig = { kind: HookKind; throws: boolean };
type PluginConfig = { decorateRun: HookKind; onAllRunsComplete: CompletionHookConfig; afterAll: CompletionHookConfig };
type PluginBatch = { isAsyncProperty: boolean; pluginConfigs: PluginConfig[] };
type Outcome = 'success' | 'skip' | 'failure';
type WrapperMode = 'forward' | 'recover' | 'fail';
type NestedOutcome = fc.PreconditionFailure | fc.PropertyFailure | null;

function isThrowing(config: CompletionHookConfig): boolean {
  return config.kind !== 'none' && config.throws;
}

function hookKindArbitrary(isAsyncProperty: boolean): fc.Arbitrary<HookKind> {
  // Asynchronous hooks are only legal on asynchronous properties
  return isAsyncProperty ? fc.constantFrom('none', 'sync', 'async') : fc.constantFrom('none', 'sync');
}

function pluginConfigArbitrary(isAsyncProperty: boolean, throwingHooks: boolean): fc.Arbitrary<PluginConfig> {
  const completionHookArbitrary = fc.record({
    kind: hookKindArbitrary(isAsyncProperty),
    throws: throwingHooks ? fc.boolean() : fc.constant(false),
  });
  return fc.record({
    decorateRun: hookKindArbitrary(isAsyncProperty),
    onAllRunsComplete: completionHookArbitrary,
    afterAll: completionHookArbitrary,
  });
}

function pluginBatchArbitrary(hooks: 'never throwing' | 'throwing at least once'): fc.Arbitrary<PluginBatch> {
  return fc.boolean().chain((isAsyncProperty) => {
    if (hooks === 'never throwing') {
      const pluginConfigs = fc.array(pluginConfigArbitrary(isAsyncProperty, false), { minLength: 1, maxLength: 4 });
      return fc.record({ isAsyncProperty: fc.constant(isAsyncProperty), pluginConfigs });
    }
    const anyConfig = pluginConfigArbitrary(isAsyncProperty, true);
    const throwingConfig = anyConfig.filter(
      (config) => isThrowing(config.onAllRunsComplete) || isThrowing(config.afterAll),
    );
    const pluginConfigs = fc
      .tuple(fc.array(anyConfig, { maxLength: 2 }), throwingConfig, fc.array(anyConfig, { maxLength: 2 }))
      .map(([before, throwing, after]) => [...before, throwing, ...after]);
    return fc.record({ isAsyncProperty: fc.constant(isAsyncProperty), pluginConfigs });
  });
}

type Probe = (label: string) => void;

function decorateRunFor(
  name: string,
  kind: HookKind,
  isAsyncProperty: boolean,
  probe: Probe,
): fc.PluginInstance<[number]>['decorateRun'] {
  if (kind === 'none') {
    return undefined;
  }
  if (!isAsyncProperty) {
    return (nestedRun) => (value) => {
      probe(`${name}::run started`);
      const out = nestedRun(value);
      probe(`${name}::run done`);
      return out;
    };
  }
  return (nestedRun) => async (value) => {
    probe(`${name}::run started`);
    if (kind === 'async') await microtasks();
    const out = await nestedRun(value);
    if (kind === 'async') await microtasks();
    probe(`${name}::run done`);
    return out;
  };
}

function completionHookFor(
  label: string,
  kind: HookKind,
  error: Error | undefined,
  probe: Probe,
  onCall?: (runDetails: fc.RunDetails<[number]> | undefined) => void,
): ((runDetails?: fc.RunDetails<[number]>) => Promise<void> | void) | undefined {
  // Whether it throws or not, the hook probes its start and its end
  switch (kind) {
    case 'none':
      return undefined;
    case 'sync':
      return (runDetails) => {
        probe(`${label} started`);
        onCall?.(runDetails);
        probe(`${label} done`);
        if (error !== undefined) throw error;
      };
    case 'async':
      return async (runDetails) => {
        probe(`${label} started`);
        onCall?.(runDetails);
        await delay0();
        probe(`${label} done`);
        if (error !== undefined) throw error;
      };
  }
}

function probingPluginFor(
  name: string,
  config: PluginConfig,
  isAsyncProperty: boolean,
  listeners: {
    probe: Probe;
    onInstantiate?: (pluginIndex: number, pluginStore: fc.PluginStore) => void;
    onAllRunsComplete?: (runDetails: fc.RunDetails<[number]> | undefined) => void;
  },
) {
  const { probe } = listeners;
  const errors = {
    onAllRunsComplete: isThrowing(config.onAllRunsComplete) ? new Error(`${name}::onAllRunsComplete`) : undefined,
    afterAll: isThrowing(config.afterAll) ? new Error(`${name}::afterAll`) : undefined,
  };
  const plugin: fc.Plugin<[number]> = (pluginIndex, pluginStore) => {
    probe(`${name} instantiated`);
    listeners.onInstantiate?.(pluginIndex, pluginStore);
    return {
      decorateRun: decorateRunFor(name, config.decorateRun, isAsyncProperty, probe),
      onAllRunsComplete: completionHookFor(
        `${name}::onAllRunsComplete`,
        config.onAllRunsComplete.kind,
        errors.onAllRunsComplete,
        probe,
        listeners.onAllRunsComplete,
      ),
      afterAll: completionHookFor(`${name}::afterAll`, config.afterAll.kind, errors.afterAll, probe),
    };
  };
  return { plugin, errors };
}

function expectedProbesFor(pluginConfigs: PluginConfig[], numExecutions: number): string[] {
  const names = pluginConfigs.map((_, index) => `#${index}`);
  const wrappers = names.filter((_, index) => pluginConfigs[index].decorateRun !== 'none');
  const probes = names.map((name) => `${name} instantiated`);
  for (let execution = 0; execution !== numExecutions; ++execution) {
    probes.push(...wrappers.map((name) => `${name}::run started`));
    probes.push('predicate called');
    probes.push(...[...wrappers].reverse().map((name) => `${name}::run done`));
  }
  for (let index = 0; index !== pluginConfigs.length; ++index) {
    if (pluginConfigs[index].onAllRunsComplete.kind !== 'none') {
      probes.push(`${names[index]}::onAllRunsComplete started`, `${names[index]}::onAllRunsComplete done`);
    }
  }
  for (let index = pluginConfigs.length - 1; index >= 0; --index) {
    if (pluginConfigs[index].afterAll.kind !== 'none') {
      probes.push(`${names[index]}::afterAll started`, `${names[index]}::afterAll done`);
    }
  }
  return probes;
}

function firstThrownErrorFor(plugins: ReturnType<typeof probingPluginFor>[]): Error | undefined {
  // Call order: onAllRunsComplete in declaration order, then afterAll in reverse order
  for (let index = 0; index !== plugins.length; ++index) {
    if (plugins[index].errors.onAllRunsComplete !== undefined) return plugins[index].errors.onAllRunsComplete;
  }
  for (let index = plugins.length - 1; index >= 0; --index) {
    if (plugins[index].errors.afterAll !== undefined) return plugins[index].errors.afterAll;
  }
  return undefined;
}

function wrappingPluginFor(mode: WrapperMode, isAsyncProperty: boolean, error: Error) {
  const seenValues: number[] = [];
  const seenAsyncNestedRuns: boolean[] = [];
  const seenNestedOutcomes: NestedOutcome[] = [];
  const rewrite = (nestedOutcome: NestedOutcome): NestedOutcome => {
    seenNestedOutcomes.push(nestedOutcome);
    switch (mode) {
      case 'forward':
        return nestedOutcome;
      case 'recover':
        return null;
      case 'fail':
        return { error };
    }
  };
  const plugin: fc.Plugin<[number]> = () => ({
    decorateRun: (nestedRun) =>
      isAsyncProperty
        ? async (value) => {
            seenValues.push(value[0]);
            const nestedOutcome = nestedRun(value);
            seenAsyncNestedRuns.push(nestedOutcome instanceof Promise);
            return rewrite(await nestedOutcome);
          }
        : (value) => {
            seenValues.push(value[0]);
            const nestedOutcome = nestedRun(value);
            seenAsyncNestedRuns.push(nestedOutcome instanceof Promise);
            return rewrite(nestedOutcome as NestedOutcome);
          },
  });
  return { plugin, error, seenValues, seenAsyncNestedRuns, seenNestedOutcomes };
}

async function runWithPlugins(config: {
  isAsyncProperty: boolean;
  arbitrary: fc.Arbitrary<number>;
  predicate: (value: number) => void;
  plugins: fc.Plugin<[number]>[];
  useAssert: boolean;
  numRuns: number;
  maxSkipsPerRun?: number;
}): Promise<{ out: fc.RunDetails<[number]> | undefined; thrown: unknown }> {
  const { isAsyncProperty, arbitrary, predicate, useAssert, ...parameters } = config;
  let out: fc.RunDetails<[number]> | void = undefined;
  let thrown: unknown = undefined;
  if (isAsyncProperty) {
    const property = fc.asyncProperty(arbitrary, async (value) => {
      predicate(value);
    });
    const pending = useAssert ? fc.assert(property, parameters) : fc.check(property, parameters);
    expect(pending).toBeInstanceOf(Promise);
    try {
      out = await pending;
    } catch (err) {
      thrown = err;
    }
  } else {
    const property = fc.property(arbitrary, (value) => {
      predicate(value);
    });
    try {
      out = useAssert ? fc.assert(property, parameters) : fc.check(property, parameters);
    } catch (err) {
      thrown = err;
    }
    expect(out).not.toBeInstanceOf(Promise); // synchronous properties must be handled synchronously
  }
  return { out: out === undefined ? undefined : out, thrown };
}
