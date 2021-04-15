import { falsy } from '../../../src/arbitrary/falsy';
import { mocked } from 'ts-jest/utils';

jest.mock('../../../src/arbitrary/constantFrom');
import * as ConstantFromMock from '../../../src/arbitrary/constantFrom';

describe('FalsyArbitrary', () => {
  describe('falsy', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should never generate 0n if no constraints have been specified', () => {
      // Arrange
      const { constantFrom } = mocked(ConstantFromMock);
      let calledWithValues: unknown[] = [];
      constantFrom.mockImplementationOnce((...values: unknown[]) => {
        calledWithValues = values;
        return null as any;
      });

      // Act
      falsy();

      // Assert
      expect(constantFrom).toHaveBeenCalledTimes(1);
      expect(calledWithValues.some((v) => typeof v === 'bigint')).toBe(false);
    });
    it('Should never generate 0n if constraints are set to {withBigInt: false}', () => {
      // Arrange
      const { constantFrom } = mocked(ConstantFromMock);
      let calledWithValues: unknown[] = [];
      constantFrom.mockImplementationOnce((...values: unknown[]) => {
        calledWithValues = values;
        return null as any;
      });

      // Act
      falsy({ withBigInt: false });

      // Assert
      expect(constantFrom).toHaveBeenCalledTimes(1);
      expect(calledWithValues.some((v) => typeof v === 'bigint')).toBe(false);
    });
    if (typeof BigInt !== 'undefined') {
      it('Should be able to generate 0n if constraints are set to {withBigInt: true}', () => {
        // Arrange
        const { constantFrom } = mocked(ConstantFromMock);
        let calledWithValues: unknown[] = [];
        constantFrom.mockImplementationOnce((...values: unknown[]) => {
          calledWithValues = values;
          return null as any;
        });

        // Act
        falsy({ withBigInt: true });

        // Assert
        expect(constantFrom).toHaveBeenCalledTimes(1);
        expect(calledWithValues.some((v) => typeof v === 'bigint')).toBe(true);
      });
    }
  });
});
