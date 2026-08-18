import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { beforeEach } from '../../../../src/check/plugin/LifeCyclePlugins.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { Plugin, PluginInstance } from '../../../../src/check/plugin/Plugin.js';

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

function hookTypeArbitrary() {
  return fc.constantFrom('sync beforeEach', 'async beforeEach');
}

function successfulPluginFor(hookType: 'sync beforeEach' | 'async beforeEach'): Plugin<unknown> {
  switch (hookType) {
    case 'sync beforeEach':
      return beforeEach(() => {});
    case 'async beforeEach':
      return beforeEach(async () => {});
  }
}

function failingPluginFor(hookType: 'sync beforeEach' | 'async beforeEach'): Plugin<unknown> {
  switch (hookType) {
    case 'sync beforeEach':
      return beforeEach(() => {
        throw new Error('sync throw');
      });
    case 'async beforeEach':
      return beforeEach(async () => {
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
