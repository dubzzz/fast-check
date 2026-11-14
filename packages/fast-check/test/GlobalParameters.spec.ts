import { afterEach, beforeEach, describe, it, expect } from 'vitest';
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

  it('should merge global parameters with local ones in fc.sample', async () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration = await fc.sample(fc.nat(), { ...globalConfig, numRuns: overridenNumRuns });

    fc.configureGlobal(globalConfig);
    const withGlobalConfiguratioOverriden = await fc.sample(fc.nat(), { numRuns: overridenNumRuns });

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

  it('should handle global and local numRuns identically when sampling a shrink path', async () => {
    const arbitrary = fc.integer({ min: 0, max: 100 });
    const params = { seed: 42, path: '0:0', examples: [100] };
    const withLocalConfiguration = await fc.sample(arbitrary, { ...params, numRuns: 1 });

    fc.configureGlobal({ numRuns: 1 });
    const withGlobalConfiguration = await fc.sample(arbitrary, params);

    expect(withLocalConfiguration.length).toBeGreaterThan(1);
    expect(withGlobalConfiguration).toEqual(withLocalConfiguration);
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
});
