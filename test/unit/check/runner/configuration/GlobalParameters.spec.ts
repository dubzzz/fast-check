import {
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal
} from '../../../../../src/check/runner/configuration/GlobalParameters';

describe('GlobalParameters', () => {
  afterEach(() => {
    resetConfigureGlobal();
  });

  it('should be able to set, read and clear parameters globally', () => {
    const myGlobalConfiguration = { numRuns: 123 };

    expect(readConfigureGlobal()).not.toBe(myGlobalConfiguration);

    configureGlobal(myGlobalConfiguration);
    expect(readConfigureGlobal()).toBe(myGlobalConfiguration);

    resetConfigureGlobal();
    expect(readConfigureGlobal()).toBe(undefined);
  });
});
