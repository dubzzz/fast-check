import { jest } from '@jest/globals';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty';

jest.unstable_mockModule('./src/check/property/SkipAfterProperty', () => ({
  SkipAfterProperty: jest.fn(),
}));
jest.unstable_mockModule('./src/check/property/TimeoutProperty', () => ({
  TimeoutProperty: jest.fn(),
}));
jest.unstable_mockModule('./src/check/property/UnbiasedProperty', () => ({
  UnbiasedProperty: jest.fn(),
}));
jest.unstable_mockModule('./src/check/property/IgnoreEqualValuesProperty', () => ({
  IgnoreEqualValuesProperty: jest.fn(),
}));
const { decorateProperty } = await import('../../../../src/check/runner/DecorateProperty');
const { Value } = await import('../../../../src/check/arbitrary/definition/Value');
const { Stream } = await import('../../../../src/stream/Stream');

// Mocks
const { SkipAfterProperty } = await import('../../../../src/check/property/SkipAfterProperty');
const { TimeoutProperty } = await import('../../../../src/check/property/TimeoutProperty');
const { UnbiasedProperty } = await import('../../../../src/check/property/UnbiasedProperty');
const { IgnoreEqualValuesProperty } = await import('../../../../src/check/property/IgnoreEqualValuesProperty');

function buildProperty(asyncProp: boolean) {
  return {
    isAsync: () => asyncProp,
    generate: () => new Value({}, undefined),
    shrink: () => Stream.nil(),
    runBeforeEach: () => {},
    run: () => null,
    runAfterEach: () => {},
  } as IRawProperty<any>;
}

describe('decorateProperty', () => {
  beforeEach(() => {
    (SkipAfterProperty as any).mockClear();
    (TimeoutProperty as any).mockClear();
    (UnbiasedProperty as any).mockClear();
    (IgnoreEqualValuesProperty as any).mockClear();
  });
  it('Should enable none when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on skipAllAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on interruptAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: 1,
      timeout: null,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable TimeoutProperty on timeout', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: 1,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable UnbiasedProperty on unbiased', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: true,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should not enable TimeoutProperty on synchronous property', () => {
    decorateProperty(buildProperty(false), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: 1,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable IgnoreEqualValuesProperty on ignoreEqualValues', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: true,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(1);
  });
  it('Should enable IgnoreEqualValuesProperty on skipEqualValues', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
      skipEqualValues: true,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(1);
  });
  it('Should enable multiple wrappers when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: 1,
      timeout: 1,
      unbiased: true,
      skipEqualValues: true,
      ignoreEqualValues: true,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(2);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(2);
  });
});
