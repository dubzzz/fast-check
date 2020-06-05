import { decorateProperty } from '../../../../src/check/runner/DecorateProperty';
import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';

// Mocks
import { SkipAfterProperty } from '../../../../src/check/property/SkipAfterProperty';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';
import { UnbiasedProperty } from '../../../../src/check/property/UnbiasedProperty';
jest.mock('../../../../src/check/property/SkipAfterProperty');
jest.mock('../../../../src/check/property/TimeoutProperty');
jest.mock('../../../../src/check/property/UnbiasedProperty');

function buildProperty(asyncProp: boolean) {
  return {
    isAsync: () => asyncProp,
    generate: () => new Shrinkable({}),
    run: () => null,
  } as IRawProperty<any>;
}

describe('decorateProperty', () => {
  beforeEach(() => {
    (SkipAfterProperty as any).mockClear();
    (TimeoutProperty as any).mockClear();
    (UnbiasedProperty as any).mockClear();
  });
  it('Should enable none when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on skipAllAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty on interruptAfterTimeLimit', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: 1,
      timeout: null,
      unbiased: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable TimeoutProperty on timeout', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: 1,
      unbiased: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable UnbiasedProperty on unbiased', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: null,
      unbiased: true,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
  });
  it('Should not enable TimeoutProperty on synchronous property', () => {
    decorateProperty(buildProperty(false), {
      skipAllAfterTimeLimit: null,
      interruptAfterTimeLimit: null,
      timeout: 1,
      unbiased: false,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable multiple wrappers when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      interruptAfterTimeLimit: 1,
      timeout: 1,
      unbiased: true,
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(2);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
  });
});
