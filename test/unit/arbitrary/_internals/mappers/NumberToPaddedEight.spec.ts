import fc from '../../../../../lib/fast-check';
import {
  numberToPaddedEightMapper,
  numberToPaddedEightUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/NumberToPaddedEight';

describe('numberToPaddedEightUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.nat({ max: 0xffffffff }), (n) => {
        // Arrange
        const mapped = numberToPaddedEightMapper(n);

        // Act
        const out = numberToPaddedEightUnmapper(mapped);

        // Assert
        expect(out).toBe(n);
      })
    ));

  it('should reject the value whenever it has an invalid length', () => {
    // Arrange
    const valueNk = '012345678';
    const valueOk = '01234567';

    // Act / Assert
    expect(() => numberToPaddedEightUnmapper(valueNk)).toThrowError();
    expect(() => numberToPaddedEightUnmapper(valueOk)).not.toThrowError();
  });

  it('should reject the value whenever it contains an invalid character', () => {
    // Arrange
    const valueNk = '0123456z';
    const valueOk = '01234567';

    // Act / Assert
    expect(() => numberToPaddedEightUnmapper(valueNk)).toThrowError();
    expect(() => numberToPaddedEightUnmapper(valueOk)).not.toThrowError();
  });

  it('should reject the value whenever it contains an uppercase hexa character', () => {
    // Arrange
    const valueNk = '89abcdeF';
    const valueOk = '89abcdef';

    // Act / Assert
    expect(() => numberToPaddedEightUnmapper(valueNk)).toThrowError();
    expect(() => numberToPaddedEightUnmapper(valueOk)).not.toThrowError();
  });
});
