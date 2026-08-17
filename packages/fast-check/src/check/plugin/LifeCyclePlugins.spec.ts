import { describe, expect, it, vi } from 'vitest';
import { beforeEach } from './LifeCyclePlugins.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';

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
    const allAnswers: { answer: ReturnType<IRawProperty<unknown, boolean>['run']>; answerType: string }[] = [
      { answer: null, answerType: 'success' },
      { answer: new PreconditionFailure(), answerType: 'precondition failure' },
      { answer: { error: new Error('abc') }, answerType: 'error' },
      { answer: null, answerType: 'asynchronous success' },
      { answer: new PreconditionFailure(), answerType: 'asynchronous precondition failure' },
      { answer: { error: new Error('abc') }, answerType: 'asynchronous error' },
      { answer: null, answerType: 'success' },
    ];

    it.each(allAnswers.map((value) => ({ kind: 'sync beforeEach' as const, ...value })))(
      "should forward runner's answer $answerType as-is on $kind",
      ({ answer }) => {
        // Arrange
        let pluginIndex = 0;
        const sharedContext = {};
        const pluginA = beforeEach(() => {});
        const instanceA = pluginA(pluginIndex++, sharedContext);
        const finalRun = instanceA.decorateRun!(() => answer);

        // Act
        const out = finalRun(null);

        // Assert
        expect(out).toBe(answer);
      },
    );

    it.each(allAnswers.map((value) => ({ kind: 'async beforeEach' as const, ...value })))(
      "should wrap runner's answer $answerType into a fresh Promise on $kind",
      async ({ answer }) => {
        // Arrange
        let pluginIndex = 0;
        const sharedContext = {};
        const pluginA = beforeEach(async () => {});
        const instanceA = pluginA(pluginIndex++, sharedContext);
        const finalRun = instanceA.decorateRun!(() => answer);

        // Act
        const out = finalRun(null);

        // Assert
        expect(out).not.toBe(answer);
        expect(await out).toBe(await answer);
      },
    );
  });

  describe('errors', () => {
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
    it('should merge consecutive instances of the plugin into a single instance', () => {
      // Arrange
      let pluginIndex = 5;
      const sharedContext = {};

      // Act
      const instanceA = beforeEach(() => {})(pluginIndex++, sharedContext);
      const instanceB = beforeEach(() => {})(pluginIndex++, sharedContext);
      const instanceC = beforeEach(() => {})(pluginIndex++, sharedContext);

      // Assert
      expect(instanceA.decorateRun).not.toBe(undefined);
      expect(instanceB.decorateRun).toBe(undefined); // handled by instanceA
      expect(instanceC.decorateRun).toBe(undefined); // handled by instanceA
    });
  });
});

// Helpers

function delay0() {
  return new Promise((r) => setTimeout(r, 0));
}
