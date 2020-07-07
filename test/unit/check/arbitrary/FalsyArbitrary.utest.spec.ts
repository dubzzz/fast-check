import { falsy } from '../../../../src/check/arbitrary/FalsyArbitrary';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { mocked } from 'ts-jest/utils';

jest.mock('../../../../src/check/arbitrary/ConstantArbitrary');
import * as ConstantArbitraryMock from '../../../../src/check/arbitrary/ConstantArbitrary';

describe('FalsyArbitrary', () => {
  describe('falsy', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should never generate 0n if no constraints have been specified', () => {
      // Arrange
      const { constantFrom } = mocked(ConstantArbitraryMock);
      let calledWithValues: unknown[] = [];
      constantFrom.mockImplementationOnce((...values: unknown[]) => {
        calledWithValues = values;
        return null as Arbitrary<unknown>;
      });

      // Act
      falsy();

      // Assert
      expect(constantFrom).toHaveBeenCalledTimes(1);
      expect(calledWithValues.some((v) => typeof v === 'bigint')).toBe(false);
    });
    it('Should never generate 0n if constraints are set to {withBigInt: false}', () => {
      // Arrange
      const { constantFrom } = mocked(ConstantArbitraryMock);
      let calledWithValues: unknown[] = [];
      constantFrom.mockImplementationOnce((...values: unknown[]) => {
        calledWithValues = values;
        return null as Arbitrary<unknown>;
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
        const { constantFrom } = mocked(ConstantArbitraryMock);
        let calledWithValues: unknown[] = [];
        constantFrom.mockImplementationOnce((...values: unknown[]) => {
          calledWithValues = values;
          return null as Arbitrary<unknown>;
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
