import fc from 'fast-check';
import {
  unboxedToBoxedMapper,
  unboxedToBoxedUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/UnboxedToBoxed';

describe('unboxedToBoxedMapper', () => {
  it.each`
    source   | expectedType
    ${false} | ${Boolean}
    ${true}  | ${Boolean}
    ${0}     | ${Number}
    ${10}    | ${Number}
    ${''}    | ${String}
    ${'a'}   | ${String}
  `('should be able to box $source', ({ source, expectedType }) => {
    // Arrange / Act
    const boxed = unboxedToBoxedMapper(source);

    // Assert
    expect(typeof boxed).toBe('object');
    expect(boxed).toBeInstanceOf(expectedType);
    expect((boxed as any).valueOf()).toBe(source);
  });

  it.each`
    source
    ${new Boolean(false)}
    ${new Number(0)}
    ${new String('')}
    ${{}}
    ${Object.create(null)}
    ${[]}
    ${new Set()}
    ${new Map()}
  `('should not alter unboxable values like $source', ({ source }) => {
    // Arrange / Act
    const boxed = unboxedToBoxedMapper(source);

    // Assert
    expect(boxed).toBe(source);
  });
});

describe('unboxedToBoxedUnmapper', () => {
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
