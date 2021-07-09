import fc from '../../../../../lib/fast-check';
import {
  unboxedToBoxedMapper,
  unboxedToBoxedUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/UnboxedToBoxed';

describe('charsToStringUnmapper', () => {
  it.each`
    source                | expected
    ${new Boolean(false)} | ${false}
    ${new Boolean(true)}  | ${true}
    ${new Number(0)}      | ${0}
    ${new Number(10)}     | ${10}
    ${new String('')}     | ${''}
    ${new String('a')}    | ${'a'}
  `('should be able to unbox boxed values like $expected', ({ source, expected }) => {
    // Arrange / Act / Assert
    expect(unboxedToBoxedUnmapper(source)).toEqual(expected);
  });

  it.each`
    source
    ${true}
    ${10}
    ${'a'}
    ${[]}
    ${{}}
    ${Object.create(null)}
  `('should keep already unboxed values as-is like $source', ({ source }) => {
    // Arrange / Act / Assert
    expect(unboxedToBoxedUnmapper(source)).toEqual(source);
  });

  it('should be able to box and unbox any non-boxed value', () =>
    fc.assert(
      fc.property(fc.array(fc.anything({ withBoxedValues: false })), (data) => {
        // Arrange
        const source = unboxedToBoxedMapper(data);

        // Act / Assert
        expect(unboxedToBoxedUnmapper(source)).toBe(data);
      })
    ));
});
