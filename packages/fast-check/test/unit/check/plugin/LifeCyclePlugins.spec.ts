import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { afterEach, beforeEach } from '../../../../src/check/plugin/LifeCyclePlugins.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { Plugin, PluginInstance } from '../../../../src/check/plugin/Plugin.js';

// TODO check wait end

describe('LifeCyclePlugins', () => {
  describe('ordering', () => {
    it.each([{ runner: 'sync' }, { runner: 'async' }])(
      'should run synchronous beforeEach before the $runner runner',
      async ({ runner }) => {
        // Arrange
        const ordering: string[] = [];
        let pluginIndex = 0;
        const sharedContext = {};
        const pluginA = beforeEach(() => {
          ordering.push('beforeEach::A');
        });
        const instanceA = pluginA(pluginIndex++, sharedContext);
        const finalRun = instanceA.decorateRun!(() => {
          ordering.push('run started');
          if (runner === 'async') {
            return delay0().then(() => {
              ordering.push('run done');
              return null;
            });
          }
          ordering.push('run done');
          return null;
        });

        // Act
        await finalRun(null);

        // Assert
        expect(ordering).toEqual(['beforeEach::A', 'run started', 'run done']);
      },
    );

    it.each([{ runner: 'sync' }, { runner: 'async' }])(
      'should run and wait asynchronous beforeEach before the $runner runner',
      async ({ runner }) => {
        // Arrange
        const ordering: string[] = [];
        let pluginIndex = 0;
        const sharedContext = {};
        const pluginA = beforeEach(async () => {
          ordering.push('beforeEach::A started');
          await delay0();
          ordering.push('beforeEach::A done');
        });
        const instanceA = pluginA(pluginIndex++, sharedContext);
        const finalRun = instanceA.decorateRun!(() => {
          ordering.push('run started');
          if (runner === 'async') {
            return delay0().then(() => {
              ordering.push('run done');
              return null;
            });
          }
          ordering.push('run done');
          return null;
        });

        // Act
        await finalRun(null);

        // Assert
        expect(ordering).toEqual(['beforeEach::A started', 'beforeEach::A done', 'run started', 'run done']);
      },
    );

    it.each([
      { order: ['sync', 'sync', 'sync'] },
      { order: ['sync', 'async', 'async'] },
      { order: ['async', 'async', 'async'] },
      { order: ['async', 'sync', 'async'] },
    ])('should execute beforeEach statements in declaration order $order', async ({ order }) => {
      // Arrange
      const expectedOrdering: string[] = [];
      const ordering: string[] = [];
      let pluginIndex = 0;
      const sharedContext = {};
      let finalRun: IRawProperty<unknown, boolean>['run'] = () => {
        ordering.push('run');
        return null;
      };
      for (const o of order) {
        expectedOrdering.push('beforeEach::A started');
        expectedOrdering.push('beforeEach::A done');
        const plugin =
          o === 'sync'
            ? beforeEach(() => {
                ordering.push('beforeEach::A started');
                ordering.push('beforeEach::A done');
              })
            : beforeEach(async () => {
                ordering.push('beforeEach::A started');
                await delay0();
                ordering.push('beforeEach::A done');
              });
        const instance = plugin(pluginIndex++, sharedContext);
        if (instance.decorateRun !== undefined) {
          finalRun = instance.decorateRun(finalRun);
        }
      }

      // Act
      await finalRun(null);

      // Assert
      expect(ordering).toEqual([...expectedOrdering, 'run']);
    });

    it('should queue everything and never run several hooks/predicate at the same time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({ hookType: hookTypeArbitrary(), fails: fc.boolean() }), { minLength: 1 }),
          fc.boolean(),
          fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
            error: new Error('abc'),
          }),
          async (hookTypes, isAsyncRun, runValue) => {
            // Arrange
            let probingFailed: boolean = false;
            const probes: string[] = [];
            let lastProbe: { type: 'start' | 'end'; label: string } | undefined;
            const probing = (type: 'start' | 'end', label: string) => {
              if (lastProbe !== undefined) {
                if (lastProbe.type === type) {
                  probingFailed ||=
                    // we only expect two consecutive "start" in very very specific cases
                    (type === 'start' && !lastProbe.label.includes('throw')) ||
                    // two consecutives "end" are never a thing
                    type == 'end';
                } else {
                  // lastProbe.type !== type
                  probingFailed ||=
                    // if previous was start (new being end), the end should be the end for previous label
                    lastProbe.type === 'start' && lastProbe.label !== label;
                }
              }
              lastProbe = { type, label };
              probes.push(`${type}>> ${label}`);
            };
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun
              ? async () => {
                  probing('start', 'predicate');
                  await delay0();
                  probing('end', 'predicate');
                  return runValue;
                }
              : () => {
                  probing('start', 'predicate');
                  probing('end', 'predicate');
                  return runValue;
                };
            const instances = hookTypes
              .map(({ hookType, fails }, index) =>
                fails
                  ? failingPluginFor(hookType, (type) => probing(type, `${hookType} #${index} throw`))
                  : successfulPluginFor(hookType, (type) => probing(type, `${hookType} #${index}`)),
              )
              .map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            await finalRun(null);

            // Assert
            expect(probingFailed ? probes : undefined).toBe(undefined);
          },
        ),
      );
    });

    it('should always wait and run all beforeEach before executing the predicate and other hooks (no throw in beforeEach hooks)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ hookType: hookTypeArbitrary('before'), fails: fc.constant(false) }),
              fc.record({ hookType: hookTypeArbitrary('after'), fails: fc.boolean() }),
            ),
            { minLength: 1 },
          ),
          fc.boolean(),
          fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
            error: new Error('abc'),
          }),
          async (hookTypes, isAsyncRun, runValue) => {
            // Arrange
            let predicateStarted = false;
            const seenBeforeEachs = new Set<string>();
            const probing = (type: 'start' | 'end', label: string) => {
              if (!predicateStarted && label.includes('beforeEach')) {
                seenBeforeEachs.add(label);
              }
            };
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun
              ? async () => {
                  predicateStarted = true;
                  return runValue;
                }
              : () => {
                  predicateStarted = true;
                  return runValue;
                };
            const instances = hookTypes
              .map(({ hookType, fails }, index) =>
                fails
                  ? failingPluginFor(hookType, (type) => probing(type, `${hookType} #${index} throw`))
                  : successfulPluginFor(hookType, (type) => probing(type, `${hookType} #${index}`)),
              )
              .map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            await finalRun(null);

            // Assert
            const beforeEachCount = hookTypes.filter(({ hookType }) => hookType.includes('beforeEach')).length;
            expect(seenBeforeEachs).toHaveLength(beforeEachCount);
          },
        ),
      );
    });

    it('should always wait and run all afterEach after executing the predicate, plus wait for them for the end', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({ hookType: hookTypeArbitrary(), fails: fc.boolean() }), { minLength: 1 }),
          fc.boolean(),
          fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
            error: new Error('abc'),
          }),
          async (hookTypes, isAsyncRun, runValue) => {
            // Arrange
            let predicateDone = false;
            const seenAfterEachs = new Set<string>();
            const probing = (type: 'start' | 'end', label: string) => {
              if (predicateDone && label.includes('afterEach')) {
                seenAfterEachs.add(label);
              } else if (label.includes('beforeEach') && label.includes('throw')) {
                predicateDone = true; // predicate will never run, beforeEach hooks stop there
              }
            };
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun
              ? async () => {
                  await delay0();
                  predicateDone = true;
                  return runValue;
                }
              : () => {
                  predicateDone = true;
                  return runValue;
                };
            const instances = hookTypes
              .map(({ hookType, fails }, index) =>
                fails
                  ? failingPluginFor(hookType, (type) => probing(type, `${hookType} #${index} throw`))
                  : successfulPluginFor(hookType, (type) => probing(type, `${hookType} #${index}`)),
              )
              .map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            await finalRun(null);

            // Assert
            const afterEachCount = hookTypes.filter(({ hookType }) => hookType.includes('afterEach')).length;
            expect(seenAfterEachs).toHaveLength(afterEachCount);
          },
        ),
      );
    });
  });

  describe('preserve output', () => {
    it('should produce a sync value if and only if all hooks and run were returning a sync value', async () => {
      await fc.assert(
        fc.property(
          fc.array(hookTypeArbitrary(), { minLength: 1 }),
          fc.boolean(),
          fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
            error: new Error('abc'),
          }),
          (hookTypes, isAsyncRun, runValue) => {
            // Arrange
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun ? async () => runValue : () => runValue;
            const instances = hookTypes
              .map((hookType) => successfulPluginFor(hookType))
              .map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            const out = finalRun(null);

            // Assert
            const expectsSync = !isAsyncRun && !hookTypes.some((hookType) => hookType.includes('async'));
            if (expectsSync) {
              expect(out).not.toBeInstanceOf(Promise);
            } else {
              expect(out).toBeInstanceOf(Promise);
            }
          },
        ),
      );
    });

    it('should return the same value as the run function if no hook failed to run', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(hookTypeArbitrary(), { minLength: 1 }),
          fc.boolean(),
          fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
            error: new Error('abc'),
          }),
          async (hookTypes, isAsyncRun, runValue) => {
            // Arrange
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun ? async () => runValue : () => runValue;
            const instances = hookTypes
              .map((hookType) => successfulPluginFor(hookType))
              .map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            const out = await finalRun(null);

            // Assert
            expect(out).toBe(runValue);
          },
        ),
      );
    });
  });

  describe('errors', () => {
    it('should mark a successful run as failed whenever one of the hooks failed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(hookTypeArbitrary()),
          hookTypeArbitrary(),
          fc.array(hookTypeArbitrary()),
          fc.boolean(),
          async (hookTypesBeforeFailure, hookTypeFailing, hookTypesAfterFailure, isAsyncRun) => {
            // Arrange
            let pluginIndex = 0;
            const sharedContext = {};
            let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun
              ? async () => null // emulates successful async run
              : () => null; // emulates successful sync run
            const instances = [
              ...hookTypesBeforeFailure.map((hookType) => successfulPluginFor(hookType)),
              failingPluginFor(hookTypeFailing),
              ...hookTypesAfterFailure.map((hookType) => successfulPluginFor(hookType)),
            ].map((plugin) => plugin(pluginIndex++, sharedContext));
            finalRun = produceFinalRun(finalRun, instances);

            // Act
            const out = await finalRun(null);

            // Assert
            expect(out).toMatchObject({ error: expect.any(Error) });
          },
        ),
      );
    });

    it.each([{ kind: 'sync' as const }, { kind: 'async' as const }])(
      'should stop and forward beforeEach error on $kind throw',
      async ({ kind }) => {
        // Arrange
        const probeB = vi.fn();
        const probeRun = vi.fn();
        let pluginIndex = 0;
        const sharedContext = {};
        const instanceA = beforeEach(
          kind === 'sync'
            ? () => {
                throw new Error('beforeEach throws');
              }
            : async () => {
                throw new Error('beforeEach throws');
              },
        )(pluginIndex++, sharedContext);
        const instanceB = beforeEach(probeB)(pluginIndex++, sharedContext);
        expect(instanceB.decorateRun).toBe(undefined); // handled by instanceA
        const finalRun = instanceA.decorateRun!(probeRun);

        // Act
        const out = await finalRun(null);

        // Assert
        expect(probeB).not.toHaveBeenCalled(); // next beforeEach never called
        expect(probeRun).not.toHaveBeenCalled(); // run never called
        expect(out).toEqual({ error: new Error('beforeEach throws') });
      },
    );
    it.each([{ kind: 'sync' as const }, { kind: 'async' as const }])(
      'should stop and forward beforeEach error on $kind throw not at the beginning of the flow',
      async ({ kind }) => {
        // Arrange
        const probeC = vi.fn();
        const probeRun = vi.fn();
        let pluginIndex = 0;
        const sharedContext = {};
        const instanceA = beforeEach(async () => {})(pluginIndex++, sharedContext);
        const instanceB = beforeEach(
          kind === 'sync'
            ? () => {
                throw new Error('beforeEach throws');
              }
            : async () => {
                throw new Error('beforeEach throws');
              },
        )(pluginIndex++, sharedContext);
        expect(instanceB.decorateRun).toBe(undefined); // handled by instanceA
        const instanceC = beforeEach(probeC)(pluginIndex++, sharedContext);
        expect(instanceC.decorateRun).toBe(undefined); // handled by instanceA
        const finalRun = instanceA.decorateRun!(probeRun);

        // Act
        const out = await finalRun(null);

        // Assert
        expect(probeC).not.toHaveBeenCalled(); // next beforeEach never called
        expect(probeRun).not.toHaveBeenCalled(); // run never called
        expect(out).toEqual({ error: new Error('beforeEach throws') });
      },
    );
  });

  describe('merge instances', () => {
    it('should merge consecutive instances of the plugin into a single instance but create a new instance at each index gap', async () => {
      await fc.assert(
        fc.property(
          fc.nat(),
          fc.array(
            fc.record({
              hookTypes: fc.array(hookTypeArbitrary(), { minLength: 1 }),
              gap: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1 },
          ),
          (startLifeCyclePluginsIndex, hookTypesAndGaps) => {
            // Arrange
            let pluginIndex = startLifeCyclePluginsIndex;
            const sharedContext = {};

            // Act / Assert
            for (let nth = 0; nth !== hookTypesAndGaps.length; ++nth) {
              const { hookTypes, gap } = hookTypesAndGaps[nth];
              for (let index = 0; index !== hookTypes.length; ++index) {
                const plugin = successfulPluginFor(hookTypes[index]);
                const instance = plugin(pluginIndex++, sharedContext);
                const expectHint = `at index ${index} of ${nth + 1}th chunk`;
                if (index === 0) {
                  expect(instance.decorateRun, expectHint).not.toBe(undefined);
                } else {
                  expect(instance.decorateRun, expectHint).toBe(undefined); // handled by first instance of the plugin
                }
              }
              pluginIndex += gap;
            }
          },
        ),
      );
    });
  });
});

// Helpers

function delay0() {
  return new Promise((r) => setTimeout(r, 0));
}

function hookTypeArbitrary(type?: 'before' | 'after') {
  const befores = ['sync beforeEach', 'async beforeEach'] as const;
  const afters = ['sync afterEach', 'async afterEach'] as const;
  return fc.constantFrom(...(type === undefined ? [...befores, ...afters] : type === 'before' ? befores : afters));
}

function successfulPluginFor(
  hookType: 'sync beforeEach' | 'async beforeEach' | 'sync afterEach' | 'async afterEach',
  probing?: (type: 'start' | 'end') => void,
): Plugin<unknown> {
  switch (hookType) {
    case 'sync beforeEach':
      return beforeEach(() => {
        probing?.('start');
        probing?.('end');
      });
    case 'async beforeEach':
      return beforeEach(async () => {
        probing?.('start');
        await delay0();
        probing?.('end');
      });
    case 'sync afterEach':
      return afterEach(() => {
        probing?.('start');
        probing?.('end');
      });
    case 'async afterEach':
      return afterEach(async () => {
        probing?.('start');
        await delay0();
        probing?.('end');
      });
  }
}

function failingPluginFor(
  hookType: 'sync beforeEach' | 'async beforeEach' | 'sync afterEach' | 'async afterEach',
  probing?: (type: 'start' | 'end') => void,
): Plugin<unknown> {
  switch (hookType) {
    case 'sync beforeEach':
      return beforeEach(() => {
        probing?.('start');
        throw new Error('sync throw');
      });
    case 'async beforeEach':
      return beforeEach(async () => {
        probing?.('start');
        throw new Error('async throw');
      });
    case 'sync afterEach':
      return afterEach(() => {
        probing?.('start');
        throw new Error('sync throw');
      });
    case 'async afterEach':
      return afterEach(async () => {
        probing?.('start');
        throw new Error('async throw');
      });
  }
}

function produceFinalRun(sourceRun: IRawProperty<null, boolean>['run'], instances: PluginInstance<unknown>[]) {
  let finalRun = sourceRun;
  for (let index = instances.length - 1; index >= 0; --index) {
    const instance = instances[index];
    if (instance.decorateRun !== undefined) {
      finalRun = instance.decorateRun(finalRun);
    }
  }
  return finalRun;
}
