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

  it('should merge global parameters with local ones in fc.statistics', async () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration = await fc.statistics(fc.nat(), String, {
      ...globalConfig,
      numRuns: overridenNumRuns,
    });

    fc.configureGlobal(globalConfig);
    const withGlobalConfigurationOverriden = await fc.statistics(fc.nat(), String, { numRuns: overridenNumRuns });

    expect(withGlobalConfigurationOverriden).toEqual(withLocalConfiguration);
  });

  it('should use global numRuns in fc.statistics when no local override is provided', async () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const withLocalConfiguration = await fc.statistics(fc.nat(), String, globalConfig);

    fc.configureGlobal(globalConfig);
    const withGlobalConfiguration = await fc.statistics(fc.nat(), String);

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
