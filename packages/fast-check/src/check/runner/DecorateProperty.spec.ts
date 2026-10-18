import { beforeEach, describe, it, expect, vi } from 'vitest';
import { nil } from '../../utils/iterator.js';
import { decorateProperty } from './DecorateProperty.js';
import type { Property } from '../property/types/Property.js';
import { Value } from '../arbitrary/definition/Value.js';

// Mocks
import { SkipAfterProperty } from '../property/plugins/SkipAfterProperty.js';
import { TimeoutProperty } from '../property/plugins/TimeoutProperty.js';
import { UnbiasedProperty } from '../property/plugins/UnbiasedProperty.js';
import { IgnoreEqualValuesProperty } from '../property/plugins/IgnoreEqualValuesProperty.js';
vi.mock('../property/plugins/SkipAfterProperty.js');
vi.mock('../property/plugins/TimeoutProperty.js');
vi.mock('../property/plugins/UnbiasedProperty.js');
vi.mock('../property/plugins/IgnoreEqualValuesProperty.js');

function buildProperty() {
  return {
    generate: () => new Value({}, undefined),
    shrink: () => nil,
    runBeforeEach: () => {},
    run: () => null,
    runAfterEach: () => {},
  } satisfies Property<any>;
}

describe('decorateProperty', () => {
  beforeEach(() => {
    (SkipAfterProperty as any).mockClear();
    (TimeoutProperty as any).mockClear();
    (UnbiasedProperty as any).mockClear();
    (IgnoreEqualValuesProperty as any).mockClear();
  });
  it('Should enable none when needed', () => {
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
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
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
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
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: 1,
      timeout: undefined,
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
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
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
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
      unbiased: true,
      skipEqualValues: false,
      ignoreEqualValues: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
    expect(IgnoreEqualValuesProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable IgnoreEqualValuesProperty on ignoreEqualValues', () => {
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
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
    decorateProperty(buildProperty(), {
      skipAllAfterTimeLimit: undefined,
      interruptAfterTimeLimit: undefined,
      timeout: undefined,
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
    decorateProperty(buildProperty(), {
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
