import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import * as fc from '../src/fast-check.js';

describe('GlobalParameters', () => {
  beforeEach(() => {
    // Prevent failing test to corrupt next ones
    fc.resetConfigureGlobal();
  });

  afterEach(() => {
    // Prevent failing test to corrupt next ones
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local ones in fc.sample', () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration = fc.sample(fc.nat(), { ...globalConfig, numRuns: overridenNumRuns });

    fc.configureGlobal(globalConfig);
    const withGlobalConfiguratioOverriden = fc.sample(fc.nat(), { numRuns: overridenNumRuns });

    expect(withGlobalConfiguratioOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local numRuns in fc.sample', () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration = fc.sample(fc.nat(), { ...globalConfig, numRuns: overridenNumRuns });

    fc.configureGlobal(globalConfig);
    const withGlobalConfiguratioOverriden = fc.sample(fc.nat(), overridenNumRuns);

    expect(withGlobalConfiguratioOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local ones in fc.statistics', () => {
    const globalConfig = { seed: 42, numRuns: 10 };

    const withLocalConfiguration: string[] = [];
    fc.statistics(fc.nat(), (v) => String(v), {
      ...globalConfig,
      logger: (v: string) => {
        withLocalConfiguration.push(v);
      },
    });

    fc.configureGlobal(globalConfig);
    const withGlobalConfiguratioOverriden: string[] = [];
    fc.statistics(fc.nat(), (v) => String(v), {
      logger: (v: string) => {
        withGlobalConfiguratioOverriden.push(v);
      },
    });

    expect(withGlobalConfiguratioOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local ones in fc.check', async () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration: number[] = [];
    await fc.check(
      fc.property(fc.nat(), (v) => {
        withLocalConfiguration.push(v);
      }),
      { ...globalConfig, numRuns: overridenNumRuns },
    );

    fc.configureGlobal(globalConfig);
    const withGlobalConfigurationOverriden: number[] = [];
    await fc.check(
      fc.property(fc.nat(), (v) => {
        withGlobalConfigurationOverriden.push(v);
      }),
      { numRuns: overridenNumRuns },
    );

    expect(withGlobalConfigurationOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local ones in fc.assert', async () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration: number[] = [];
    await fc.assert(
      fc.property(fc.nat(), (v) => {
        withLocalConfiguration.push(v);
      }),
      { ...globalConfig, numRuns: overridenNumRuns },
    );

    fc.configureGlobal(globalConfig);
    const withGlobalConfigurationOverriden: number[] = [];
    await fc.assert(
      fc.property(fc.nat(), (v) => {
        withGlobalConfigurationOverriden.push(v);
      }),
      { numRuns: overridenNumRuns },
    );

    expect(withGlobalConfigurationOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should disable default plugins when noDefaultPlugins is globally enabled', async () => {
    fc.configureGlobal({ noDefaultPlugins: true });
    const onAllRunsComplete = vi.fn();

    await expect(
      fc.assert(
        fc.property(fc.constant(42), () => false),
        {
          plugins: [() => ({ onAllRunsComplete })],
        },
      ),
    ).resolves.toBeUndefined();
    expect(onAllRunsComplete).toHaveBeenCalledOnce();
    expect(onAllRunsComplete.mock.calls[0][0]).toMatchObject({
      failed: true,
      counterexample: [42],
      runConfiguration: { noDefaultPlugins: true },
    });
  });

  it('should locally enable default plugins when noDefaultPlugins is globally enabled', async () => {
    fc.configureGlobal({ noDefaultPlugins: true });

    await expect(
      fc.assert(
        fc.property(fc.constant(42), () => false),
        { noDefaultPlugins: false },
      ),
    ).rejects.toThrowError('Property failed');
  });

  it('should locally disable default plugins when noDefaultPlugins is globally disabled', async () => {
    fc.configureGlobal({ noDefaultPlugins: false });

    await expect(
      fc.assert(
        fc.property(fc.constant(42), () => false),
        { noDefaultPlugins: true },
      ),
    ).resolves.toBeUndefined();
  });

  it.each([true, false])(
    'should preserve noDefaultPlugins=%s for an ongoing run when global configuration changes',
    async (noDefaultPlugins) => {
      fc.configureGlobal({ noDefaultPlugins });
      const onAllRunsComplete = vi.fn();
      const out = fc.assert(
        fc.property(fc.constant(42), async () => {
          fc.configureGlobal({ noDefaultPlugins: !noDefaultPlugins });
          return false;
        }),
        { plugins: [() => ({ onAllRunsComplete })] },
      );

      if (noDefaultPlugins) {
        await expect(out).resolves.toBeUndefined();
      } else {
        await expect(out).rejects.toThrowError('Property failed');
      }
      expect(onAllRunsComplete).toHaveBeenCalledOnce();
      expect(onAllRunsComplete.mock.calls[0][0]).toMatchObject({
        failed: true,
        runConfiguration: { noDefaultPlugins },
      });
    },
  );
});
