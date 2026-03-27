import { beforeEach, describe, it, expect, vi } from 'vitest';
import { decorateProperty } from '../../../../src/check/runner/DecorateProperty.js';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';
import { Stream } from '../../../../src/stream/Stream.js';

// Mocks
import { AbortedProperty } from '../../../../src/check/property/AbortedProperty.js';
import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty.js';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty.js';
import { UnbiasedProperty } from '../../../../src/check/property/UnbiasedProperty.js';
import { IgnoreEqualValuesProperty } from '../../../../src/check/property/IgnoreEqualValuesProperty.js';
vi.mock('../../../../src/check/property/AbortedProperty');
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
    (AbortedProperty as any).mockClear();
    (SkipAfterProperty as any).mockClear();
    (TimeoutProperty as any).mockClear();
    (UnbiasedProperty as any).mockClear();
    (IgnoreEqualValuesProperty as any).mockClear();
  });
  it('Should enable none when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(AbortedProperty).toHaveBeenCalledTimes(0);
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on skipAllAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on interruptAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: 1,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable TimeoutProperty on timeout', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: 1,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable UnbiasedProperty on unbiased', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: true,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should not enable TimeoutProperty on synchronous property', () => {
    decorateProperty(buildProperty(false), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: 1,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(AbortedProperty).toHaveBeenCalledTimes(0);
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable IgnoreEqualValuesProperty on ignoreEqualValues', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: true,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(1);
  });
  it('Should enable IgnoreEqualValuesProperty on skipEqualValues', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: true,
      ignoreEqualValues: false,
      signal: undefined,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(1);
  });
  it('Should enable AbortedProperty on signal', () => {
    const abortController = new AbortController();
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: false,
      skipEqualValues: false,
      ignoreEqualValues: false,
      signal: abortController.signal,
    });
    expect(AbortedProperty).toHaveBeenCalledTimes(1);
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable multiple wrappers when needed', () => {
    const abortController = new AbortController();
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: 1,
      timeout: 1,
      unbiased: true,
      skipEqualValues: true,
      ignoreEqualValues: true,
      signal: abortController.signal,
    });
    expect(AbortedProperty).toHaveBeenCalledTimes(1);
    expect(SkipAfterProperty).toHaveBeenCalledTimes(2);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(2);
  });
});
