import * as fc from '../../src/fast-check';

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

  it('should merge global parameters with local ones in fc.check', () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration: number[] = [];
    fc.check(
      fc.property(fc.nat(), (v) => {
        withLocalConfiguration.push(v);
      }),
      { ...globalConfig, numRuns: overridenNumRuns }
    );

    fc.configureGlobal(globalConfig);
    const withGlobalConfigurationOverriden: number[] = [];
    fc.check(
      fc.property(fc.nat(), (v) => {
        withGlobalConfigurationOverriden.push(v);
      }),
      { numRuns: overridenNumRuns }
    );

    expect(withGlobalConfigurationOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });

  it('should merge global parameters with local ones in fc.assert', () => {
    const globalConfig = { seed: 42, numRuns: 10 };
    const overridenNumRuns = 100;

    const withLocalConfiguration: number[] = [];
    fc.assert(
      fc.property(fc.nat(), (v) => {
        withLocalConfiguration.push(v);
      }),
      { ...globalConfig, numRuns: overridenNumRuns }
    );

    fc.configureGlobal(globalConfig);
    const withGlobalConfigurationOverriden: number[] = [];
    fc.assert(
      fc.property(fc.nat(), (v) => {
        withGlobalConfigurationOverriden.push(v);
      }),
      { numRuns: overridenNumRuns }
    );

    expect(withGlobalConfigurationOverriden).toEqual(withLocalConfiguration);
    fc.resetConfigureGlobal();
  });
});
