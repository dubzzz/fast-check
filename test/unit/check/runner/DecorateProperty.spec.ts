import { decorateProperty } from '../../../../src/check/runner/DecorateProperty';
import { IProperty } from '../../../../src/check/property/IProperty';
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
    run: () => null
  } as IProperty<any>;
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
      timeout: null,
      unbiased: false
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable SkipAfterProperty when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      timeout: null,
      unbiased: false
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable TimeoutProperty when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      timeout: 1,
      unbiased: false
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable UnbiasedProperty when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: null,
      timeout: null,
      unbiased: true
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
  });
  it('Should not enable TimeoutProperty on synchronous property', () => {
    decorateProperty(buildProperty(false), {
      skipAllAfterTimeLimit: null,
      timeout: 1,
      unbiased: false
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(0);
    expect(TimeoutProperty).toHaveBeenCalledTimes(0);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(0);
  });
  it('Should enable multiple wrappers when needed', () => {
    decorateProperty(buildProperty(true), {
      skipAllAfterTimeLimit: 1,
      timeout: 1,
      unbiased: true
    });
    expect(SkipAfterProperty).toHaveBeenCalledTimes(1);
    expect(TimeoutProperty).toHaveBeenCalledTimes(1);
    expect(UnbiasedProperty).toHaveBeenCalledTimes(1);
  });
});
