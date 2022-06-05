import {
  configureGlobal,
  readConfigureGlobal,
  resetConfigureGlobal,
} from '../../../../../src/check/runner/configuration/GlobalParameters';
import * as fc from '../../../../../lib/fast-check';

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
    expect(readConfigureGlobal()).toEqual({});
  });
  it('should use distinct global configurations for distinct instances of fast-check', () => {
    const myGlobalConfiguration = { numRuns: 123 };

    configureGlobal(myGlobalConfiguration);
    expect(readConfigureGlobal()).toBe(myGlobalConfiguration);
    expect(fc.readConfigureGlobal()).not.toBe(myGlobalConfiguration);
  });
});
