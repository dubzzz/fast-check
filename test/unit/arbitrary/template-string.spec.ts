import { anything } from '../../../src/arbitrary/anything';
import { constant } from '../../../src/arbitrary/constant';
import { templateString } from '../../../src/arbitrary/template-string';
import { tuple } from '../../../src/arbitrary/tuple';
import { property } from '../../../src/check/property/Property';
import { assert } from '../../../src/check/runner/Runner';
import { sample } from '../../../src/check/runner/Sampler';

describe('template string', () => {
  it('should interpolate constant strings', () => {
    expect(sample(templateString`foo`, 1)[0]).toStrictEqual('foo');
    expect(sample(templateString`foo${constant('bar')}`, 1)[0]).toStrictEqual('foobar');
    expect(sample(templateString`${constant('foo')}bar`, 1)[0]).toStrictEqual('foobar');
    expect(sample(templateString`foo${constant('bar')}baz`, 1)[0]).toStrictEqual('foobarbaz');
  });

  it('should interpolate values into strings identically to untagged template strings', () => {
    assert(
      property(
        anything().chain((value) => tuple(templateString`${constant(value)}`, constant(`${value}`))),
        ([templated, interpolated]) => expect(templated).toBe(interpolated)
      )
    );
  });

  it('should fail for uninterpolatable values', () => {
    expect(() => sample(templateString`${constant(Symbol())}`)[0]).toThrowErrorMatchingInlineSnapshot(
      `"Cannot convert a Symbol value to a string"`
    );
  });
});
