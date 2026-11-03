import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';

describe('Global plugins', () => {
  let previousPlugins: ReturnType<typeof readInstalledGlobalPlugins>;
  let previousParameters: ReturnType<typeof fc.readConfigureGlobal>;
  beforeEach(() => {
    previousPlugins = readInstalledGlobalPlugins().slice();
    previousParameters = fc.readConfigureGlobal();
  });
  afterEach(() => {
    const installedPlugins = readInstalledGlobalPlugins();
    installedPlugins.splice(0, installedPlugins.length, ...previousPlugins);
    fc.configureGlobal(previousParameters);
  });

  it.each([
    { global: undefined, local: undefined, disabled: false },
    { global: true, local: undefined, disabled: true },
    { global: false, local: true, disabled: true },
    { global: true, local: false, disabled: false },
  ])('should resolve noGlobalPlugins with global=$global and local=$local', async ({ global, local, disabled }) => {
    // Arrange
    let instances = 0;
    let runs = 0;
    const details: fc.RunDetails<[number]>[] = [];
    fc.installGlobalPlugin(() => {
      ++instances;
      return {};
    });
    fc.configureGlobal({ seed: 4242, numRuns: 3, noGlobalPlugins: global });

    // Act
    await fc.assert(
      fc.property(fc.constant<number>(42), () => {
        ++runs;
        return true;
      }),
      {
        ...(local === undefined ? {} : { noGlobalPlugins: local }),
        plugins: [() => ({ onAllRunsComplete: (out) => void details.push(out) })],
      },
    );

    // Assert
    expect(instances).toBe(disabled ? 0 : 1);
    expect(runs).toBe(3);
    expect(details).toHaveLength(1);
    expect(details[0].seed).toBe(4242);
    expect(details[0].numRuns).toBe(3);
    expect(details[0].runConfiguration.noGlobalPlugins).toBe(disabled);
  });

  it('should skip global factories while preserving local plugin order and shared storage', async () => {
    // Arrange
    const calls: string[] = [];
    const stores: fc.PluginStore[] = [];
    const globalPlugin = () => {
      throw new Error('Global factory called');
    };
    fc.installGlobalPlugin(globalPlugin);
    const localPlugin =
      (name: string): fc.Plugin<[number]> =>
      (index, store) => {
        calls.push(`${name}: instance ${index}`);
        stores.push(store);
        return {
          decorateGenerate:
            (generate) =>
            (...args) => {
              calls.push(`${name}: generate`);
              return generate(...args);
            },
          decorateRun:
            (run) =>
            (...args) => {
              calls.push(`${name}: run`);
              return run(...args);
            },
          onAllRunsComplete: () => void calls.push(`${name}: complete`),
          afterAll: () => void calls.push(`${name}: cleanup`),
        };
      };
    const property = fc.property(fc.constant<number>(42), () => {
      calls.push('predicate');
      return true;
    });

    // Act
    await fc.assert(property, {
      numRuns: 1,
      noGlobalPlugins: true,
      plugins: [localPlugin('a'), localPlugin('b')],
    });

    // Assert
    expect(calls).toEqual([
      'a: instance 0',
      'b: instance 1',
      'a: generate',
      'b: generate',
      'a: run',
      'b: run',
      'predicate',
      'a: complete',
      'b: complete',
      'b: cleanup',
      'a: cleanup',
    ]);
    expect(stores[0]).toBe(stores[1]);
    expect(() => fc.assert(property, { numRuns: 1 })).toThrow('Global factory called');
  });

  it.each([
    { noGlobalPlugins: false, noDefaultPlugins: false, error: 'Global report' },
    { noGlobalPlugins: false, noDefaultPlugins: true, error: 'Global report' },
    { noGlobalPlugins: true, noDefaultPlugins: false, error: 'Property failed after 1 tests' },
    { noGlobalPlugins: true, noDefaultPlugins: true, error: undefined },
  ])(
    'should independently control global=$noGlobalPlugins and default=$noDefaultPlugins disabling',
    async ({ noGlobalPlugins, noDefaultPlugins, error }) => {
      // Arrange
      const failures: boolean[] = [];
      fc.installGlobalPlugin(() => ({
        onAllRunsComplete: () => {
          throw new Error('Global report');
        },
      }));
      const run = () =>
        fc.assert(
          fc.property(fc.constant<number>(42), () => false),
          {
            numRuns: 1,
            noGlobalPlugins,
            noDefaultPlugins,
            plugins: [() => ({ onAllRunsComplete: (out) => void failures.push(out.failed) })],
          },
        );

      // Act / Assert
      if (error === undefined) {
        await expect(run()).resolves.toBeUndefined();
      } else {
        await expect(run).rejects.toThrow(error);
      }
      expect(failures).toEqual([true]);
    },
  );

  it('should still report local plugin errors when global and default plugins are disabled', async () => {
    await expect(() =>
      fc.assert(
        fc.property(fc.constant<number>(42), () => true),
        {
          numRuns: 1,
          noGlobalPlugins: true,
          noDefaultPlugins: true,
          plugins: [
            () => ({
              onAllRunsComplete: () => {
                throw new Error('Local report');
              },
            }),
          ],
        },
      ),
    ).rejects.toThrow('Local report');
  });

  it('should allow a global hook to run a nested assertion without re-entering global hooks', async () => {
    // Arrange
    const calls: string[] = [];
    let insideHook = false;
    fc.installGlobalPlugin(
      fc.beforeEach(async () => {
        if (insideHook) throw new Error('Global hook re-entered');
        insideHook = true;
        calls.push('global hook');
        try {
          await fc.assert(
            fc.property(fc.constant<number>(42), () => {
              calls.push('inner');
              return true;
            }),
            { numRuns: 1, noGlobalPlugins: true },
          );
        } finally {
          insideHook = false;
        }
      }),
    );
    const property = fc.property(fc.constant<number>(42), () => {
      calls.push('outer');
      return true;
    });

    // Act
    await fc.assert(property, { numRuns: 1 });
    await fc.assert(property, { numRuns: 1 });

    // Assert
    expect(calls).toEqual(['global hook', 'inner', 'outer', 'global hook', 'inner', 'outer']);
  });

  it('should leave global plugins available while an isolated assertion is pending', async () => {
    // Arrange
    let globalRuns = 0;
    fc.installGlobalPlugin(fc.beforeEach(() => void ++globalRuns));
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const isolated = fc.assert(
      fc.property(fc.constant<number>(42), () => pending),
      {
        numRuns: 1,
        noGlobalPlugins: true,
      },
    );

    // Act
    try {
      await fc.assert(
        fc.property(fc.constant<number>(42), () => true),
        { numRuns: 1 },
      );
    } finally {
      release();
      await isolated;
    }

    // Assert
    expect(globalRuns).toBe(1);
  });
});
