import {
  indexToMappedConstantMapperFor,
  indexToMappedConstantUnmapperFor,
} from '../../../../../src/arbitrary/_internals/mappers/IndexToMappedConstant';

describe('indexToMappedConstantMapperFor', () => {
  it.each`
    index | value
    ${0}  | ${'A0'}
    ${1}  | ${'A1'}
    ${9}  | ${'A9'}
    ${10} | ${'B0'}
    ${11} | ${'D0'}
    ${12} | ${'D1'}
    ${15} | ${'D4'}
  `('should properly map index $index to value $value', ({ index, value }) => {
    // Arrange
    const entries = [
      { num: 10, build: (index: number) => `A${index}` },
      { num: 1, build: (index: number) => `B${index}` },
      { num: 0, build: (index: number) => `C${index}` },
      { num: 5, build: (index: number) => `D${index}` },
    ];

    // Act
    const computedValue = indexToMappedConstantMapperFor(entries)(index);

    // Assert
    expect(computedValue).toBe(value);
  });
});

describe('indexToMappedConstantUnmapperFor', () => {
  it.each`
    index | value
    ${0}  | ${'A0'}
    ${1}  | ${'A1'}
    ${9}  | ${'A9'}
    ${10} | ${'B0'}
    ${11} | ${'D0'}
    ${12} | ${'D1'}
    ${15} | ${'D4'}
  `('should properly unmap value $value to index $index', ({ index, value }) => {
    // Arrange
    const entries = [
      { num: 10, build: (index: number) => `A${index}` },
      { num: 1, build: (index: number) => `B${index}` },
      { num: 0, build: (index: number) => `C${index}` },
      { num: 5, build: (index: number) => `D${index}` },
    ];

    // Act
    const computedIndex = indexToMappedConstantUnmapperFor(entries)(value);

    // Assert
    expect(computedIndex).toBe(index);
  });

  it('should properly unmap 0, -0 and NaN when defined in the mappings', () => {
    // Arrange
    const entries = [
      { num: 10, build: (index: number) => `A${index}` },
      { num: 1, build: (_index: number) => 0 },
      { num: 2, build: (index: number) => `C${index}` },
      { num: 1, build: (_index: number) => -0 },
      { num: 1, build: (_index: number) => Number.NaN },
      { num: 5, build: (index: number) => `D${index}` },
    ];

    // Act
    const unmapper = indexToMappedConstantUnmapperFor<unknown>(entries);
    const computedIndexZero = unmapper(0);
    const computedIndexMinusZero = unmapper(-0);
    const computedIndexNaN = unmapper(Number.NaN);
    const computedIndexOther = unmapper('D2');

    // Assert
    expect(computedIndexZero).toBe(10);
    expect(computedIndexMinusZero).toBe(13);
    expect(computedIndexNaN).toBe(14);
    expect(computedIndexOther).toBe(17);
  });

  it('should not call any build function when creating the unmapper', () => {
    // Arrange
    const entries = [
      { num: 10, build: jest.fn() },
      { num: 3, build: jest.fn() },
    ];

    // Act
    indexToMappedConstantUnmapperFor(entries);

    // Assert
    expect(entries[0].build).not.toHaveBeenCalled();
    expect(entries[1].build).not.toHaveBeenCalled();
  });

  it('should call all build functions on first call to unmapper', () => {
    // Arrange
    const entries = [
      { num: 10, build: jest.fn().mockReturnValue(0) },
      { num: 3, build: jest.fn().mockReturnValue(1) },
    ];

    // Act
    const unmapper = indexToMappedConstantUnmapperFor(entries);
    unmapper(0);

    // Assert
    expect(entries[0].build).toHaveBeenCalledTimes(entries[0].num);
    expect(entries[1].build).toHaveBeenCalledTimes(entries[1].num);
  });

  it('should not call again build functions on second call to unmapper', () => {
    // Arrange
    const entries = [
      { num: 10, build: jest.fn().mockReturnValue(0) },
      { num: 3, build: jest.fn().mockReturnValue(1) },
    ];

    // Act
    const unmapper = indexToMappedConstantUnmapperFor(entries);
    unmapper(0);
    unmapper(1);

    // Assert
    expect(entries[0].build).toHaveBeenCalledTimes(entries[0].num);
    expect(entries[1].build).toHaveBeenCalledTimes(entries[1].num);
  });
});
