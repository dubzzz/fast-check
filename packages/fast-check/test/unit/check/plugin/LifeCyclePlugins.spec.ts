import { describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { afterEach, beforeEach } from '../../../../src/check/plugin/LifeCyclePlugins.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import type { Plugin, PluginInstance } from '../../../../src/check/plugin/Plugin.js';

describe('LifeCyclePlugins', () => {
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

  it('should apply proper relative order: beforeEach then predicate then afterEach', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ hookType: hookTypeArbitrary(), fails: fc.boolean() }), { minLength: 1 }),
        fc.boolean(),
        fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
          error: new Error('abc'),
        }),
        async (hookTypes, isAsyncRun, runValue) => {
          // Arrange
          let lastChunk = -1;
          let hasFailedStep = false;
          const seenSteps: string[] = [];
          const probing = (type: 'start' | 'end', label: string, index: number) => {
            const currentChunk = label.includes('afterEach') ? 3 : label === 'predicate' ? 2 : 1;
            hasFailedStep ||= currentChunk < lastChunk;
            seenSteps.push(`${type} ${label} ${index}`);
          };
          let pluginIndex = 0;
          const sharedContext = {};
          let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun ? async () => runValue : () => runValue;
          const instances = hookTypes
            .map(({ hookType, fails }, index) =>
              fails
                ? failingPluginFor(hookType, (type) => probing(type, hookType, index))
                : successfulPluginFor(hookType, (type) => probing(type, hookType, index)),
            )
            .map((plugin) => plugin(pluginIndex++, sharedContext));
          finalRun = produceFinalRun(finalRun, instances);

          // Act
          await finalRun(null);

          // Assert
          expect(hasFailedStep ? seenSteps : undefined).toBe(undefined);
        },
      ),
    );
  });

  it('should always trigger all beforeEach hooks in declaration order when no other beforeEach throw', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.record({ hookType: hookTypeArbitrary('only', 'beforeEach'), fails: fc.constant(false) }),
            fc.record({ hookType: hookTypeArbitrary('except', 'beforeEach'), fails: fc.boolean() }),
          ),
          { minLength: 1 },
        ),
        fc.boolean(),
        fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
          error: new Error('abc'),
        }),
        async (hookTypes, isAsyncRun, runValue) => {
          // Arrange
          const seenStartsOfBeforeEach: number[] = [];
          const probing = (type: 'start' | 'end', label: string, index: number) => {
            if (type === 'start' && label.includes('beforeEach')) {
              seenStartsOfBeforeEach.push(index);
            }
          };
          let pluginIndex = 0;
          const sharedContext = {};
          let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun ? async () => runValue : () => runValue;
          const instances = hookTypes
            .map(({ hookType, fails }, index) =>
              fails
                ? failingPluginFor(hookType, (type) => probing(type, hookType, index))
                : successfulPluginFor(hookType, (type) => probing(type, hookType, index)),
            )
            .map((plugin) => plugin(pluginIndex++, sharedContext));
          finalRun = produceFinalRun(finalRun, instances);

          // Act
          await finalRun(null);

          // Assert
          const expectedBeforeEachs = hookTypes.flatMap(({ hookType }, index) =>
            hookType.includes('beforeEach') ? [index] : [],
          );
          expect(seenStartsOfBeforeEach).toEqual(expectedBeforeEachs);
        },
      ),
    );
  });

  it('should always trigger all afterEach hooks in reverse order no matter the status of other hooks or predicate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ hookType: hookTypeArbitrary(), fails: fc.boolean() }), { minLength: 1 }),
        fc.boolean(),
        fc.constantFrom<ReturnType<IRawProperty<unknown, boolean>['run']>>(null, new PreconditionFailure(), {
          error: new Error('abc'),
        }),
        async (hookTypes, isAsyncRun, runValue) => {
          // Arrange
          const seenStartsOfAfterEach: number[] = [];
          const probing = (type: 'start' | 'end', label: string, index: number) => {
            if (type === 'start' && label.includes('afterEach')) {
              seenStartsOfAfterEach.push(index);
            }
          };
          let pluginIndex = 0;
          const sharedContext = {};
          let finalRun: IRawProperty<null, boolean>['run'] = isAsyncRun ? async () => runValue : () => runValue;
          const instances = hookTypes
            .map(({ hookType, fails }, index) =>
              fails
                ? failingPluginFor(hookType, (type) => probing(type, hookType, index))
                : successfulPluginFor(hookType, (type) => probing(type, hookType, index)),
            )
            .map((plugin) => plugin(pluginIndex++, sharedContext));
          finalRun = produceFinalRun(finalRun, instances);

          // Act
          await finalRun(null);

          // Assert
          const expectedAfterEachs = hookTypes.flatMap(({ hookType }, index) =>
            hookType.includes('afterEach') ? [index] : [],
          );
          const expectedAfterEachsButReversed = [...expectedAfterEachs].reverse();
          expect(seenStartsOfAfterEach).toEqual(expectedAfterEachsButReversed);
        },
      ),
    );
  });

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

  it('should interrupt the beforeEach and predicate flow in case a beforeEach throws', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .tuple(
            fc.array(fc.record({ hookType: hookTypeArbitrary(), fails: fc.boolean() })),
            hookTypeArbitrary('only', 'beforeEach'),
          )
          .chain(([potentiallySafeHooks, throwingBefore]) =>
            fc.shuffledSubarray([...potentiallySafeHooks, { hookType: throwingBefore, fails: true }], {
              minLength: potentiallySafeHooks.length + 1,
            }),
          ),
        async (hookTypes) => {
          // Arrange
          let beforeEachCalledAfterFailure = false;
          let beforeEachFailedStarted = false;
          let pluginIndex = 0;
          const sharedContext = {};
          const originalRun = vi.fn();
          let finalRun: IRawProperty<null, boolean>['run'] = originalRun;
          const probing = (hookType: string, fails: boolean) => {
            if (!hookType.includes('beforeEach')) {
              return;
            }
            beforeEachCalledAfterFailure ||= beforeEachFailedStarted;
            beforeEachFailedStarted ||= fails;
          };
          const instances = hookTypes
            .map(({ hookType, fails }) =>
              fails
                ? failingPluginFor(hookType, () => probing(hookType, true))
                : successfulPluginFor(hookType, () => probing(hookType, false)),
            )
            .map((plugin) => plugin(pluginIndex++, sharedContext));
          finalRun = produceFinalRun(finalRun, instances);

          // Act
          await finalRun(null);

          // Assert
          expect(originalRun).not.toHaveBeenCalled(); // predicate not called
          expect(beforeEachCalledAfterFailure).toBe(false); // no call of beforeEach after a throwing one
        },
      ),
    );
  });

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

// Helpers

function delay0() {
  return new Promise((r) => setTimeout(r, 0));
}

function hookTypeArbitrary(
  ...config: [] | ['only', 'beforeEach' | 'afterEach'] | ['except', 'beforeEach' | 'afterEach']
) {
  const beforeEach = ['sync beforeEach', 'async beforeEach'] as const;
  const afterEach = ['sync afterEach', 'async afterEach'] as const;
  const all = [...beforeEach, ...afterEach];
  if (config.length === 0) {
    return fc.constantFrom(...all);
  }
  let selection: typeof all;
  switch (config[1]) {
    case 'beforeEach':
      selection = [...beforeEach];
      break;
    case 'afterEach':
      selection = [...afterEach];
      break;
  }
  return fc.constantFrom(...(config[0] === 'only' ? selection : all.filter((value) => !selection.includes(value))));
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
