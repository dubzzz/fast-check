import { mocked } from 'ts-jest/utils';

import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';
import { oneof, OneOfConstraints } from '../../../src/arbitrary/oneof';

import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';
jest.mock('../../../src/arbitrary/_internals/FrequencyArbitrary');

describe('OneOfArbitrary', () => {
  describe('oneof', () => {
    it('Should call frequency with empty constraints if no constraints have been passed', () => {
      // Arrange
      const from = mocked(FrequencyArbitraryMock.FrequencyArbitrary.from);
      const arb1 = constant(1);
      const arb2 = constant(2);

      // Act
      oneof(arb1, arb2);

      // Assert
      expect(from).toHaveBeenCalledWith(
        [
          { arbitrary: arb1, weight: 1 },
          { arbitrary: arb2, weight: 1 },
        ],
        {}, // empty constraints
        'fc.oneof'
      );
    });

    it('Should pass received constraints to frequency', () => {
      // Arrange
      const from = mocked(FrequencyArbitraryMock.FrequencyArbitrary.from);
      const constraints: OneOfConstraints = { maxDepth: 10, depthIdentifier: 'hello' };
      const arb1 = constant(1);
      const arb2 = constant(2);

      // Act
      oneof(constraints, arb1, arb2);

      // Assert
      expect(from).toHaveBeenCalledWith(
        [
          { arbitrary: arb1, weight: 1 },
          { arbitrary: arb2, weight: 1 },
        ],
        constraints,
        'fc.oneof'
      );
    });

    it('Should pass received constraints to frequency even if empty', () => {
      // Arrange
      const from = mocked(FrequencyArbitraryMock.FrequencyArbitrary.from);
      const constraints: OneOfConstraints = {};
      const arb1 = constant(1);
      const arb2 = constant(2);

      // Act
      oneof(constraints, arb1, arb2);

      // Assert
      expect(from).toHaveBeenCalledWith(
        [
          { arbitrary: arb1, weight: 1 },
          { arbitrary: arb2, weight: 1 },
        ],
        constraints,
        'fc.oneof'
      );
    });
  });
});
