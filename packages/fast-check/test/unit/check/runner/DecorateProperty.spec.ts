import { beforeEach, describe, it, expect, vi } from 'vitest';
import { decorateProperty } from '../../../../src/check/runner/DecorateProperty';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../../src/stream/Stream';

// Mocks
import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';
import { UnbiasedProperty } from '../../../../src/check/property/UnbiasedProperty';
import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty';
vi.mock('../../../../src/check/property/SkipAfterProperty');
vi.mock('../../../../src/check/property/TimeoutProperty');
vi.mock('../../../../src/check/property/UnbiasedProperty');
vi.mock('../../../../src/check/property/IgnoreEqualValuesProperty');

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
