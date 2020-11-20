import * as fc from '../../../../../lib/fast-check';

import { biasNumeric, integerLogLike, bigIntLogLike } from '../../../../../src/check/arbitrary/helpers/BiasNumeric';

describe('BiasNumeric', () => {
  describe('biasNumeric', () => {
    it('Should bias close to extreme values and zero if min and max have opposite signs', () =>
      fc.assert(
        fc.property(fc.integer(Number.MIN_SAFE_INTEGER, -1), fc.integer(1, Number.MAX_SAFE_INTEGER), (min, max) => {
          // Arrange
          const Ctor = jest.fn().mockImplementation((min, max, genMin, genMax) => {
            if (genMin > genMax) throw new Error(`Received genMin=${genMin} > genMax=${genMax}`);
            if (min > genMin) throw new Error(`Received min=${min} > genMin=${genMin}`);
            if (max < genMax) throw new Error(`Received max=${max} < genMax=${genMax}`);
          });

          // Act
          biasNumeric(min, max, Ctor, integerLogLike);

          // Assert
          expect(Ctor).toHaveBeenCalledTimes(3);
          expect(Ctor).toHaveBeenCalledWith(min, max, min, expect.any(Number)); // close to min
          expect(Ctor).toHaveBeenCalledWith(min, max, expect.any(Number), max); // close to max
          expect(Ctor).toHaveBeenCalledWith(min, max, expect.toBeWithinRange(min, 0), expect.toBeWithinRange(0, max)); // close to zero
        })
      ));

    it('Should bias close to extreme values if min and max have same signs', () =>
      fc.assert(
        fc.property(
          fc.constantFrom(1, -1),
          fc.integer(0, Number.MAX_SAFE_INTEGER),
          fc.integer(0, Number.MAX_SAFE_INTEGER),
          (sign, minRaw, maxRaw) => {
            // Arrange
            fc.pre(minRaw !== maxRaw);
            const Ctor = jest.fn().mockImplementation((min, max, genMin, genMax) => {
              if (genMin > genMax) throw new Error(`Received genMin=${genMin} > genMax=${genMax}`);
              if (min > genMin) throw new Error(`Received min=${min} > genMin=${genMin}`);
              if (max < genMax) throw new Error(`Received max=${max} < genMax=${genMax}`);
            });
            const min = sign * minRaw;
            const max = sign * maxRaw;

            // Act
            biasNumeric(min, max, Ctor, integerLogLike);

            // Assert
            expect(Ctor).toHaveBeenCalledTimes(2);
            expect(Ctor).toHaveBeenCalledWith(min, max, min, expect.any(Number)); // close to min
            expect(Ctor).toHaveBeenCalledWith(min, max, expect.any(Number), max); // close to max
          }
        )
      ));

    it('Should not bias anything for equal values of min and max', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), (minMax) => {
          // Arrange
          const Ctor = jest.fn().mockImplementation((min, max, genMin, genMax) => {
            if (genMin > genMax) throw new Error(`Received genMin=${genMin} > genMax=${genMax}`);
            if (min > genMin) throw new Error(`Received min=${min} > genMin=${genMin}`);
            if (max < genMax) throw new Error(`Received max=${max} < genMax=${genMax}`);
          });

          // Act
          biasNumeric(minMax, minMax, Ctor, integerLogLike);

          // Assert
          expect(Ctor).toHaveBeenCalledTimes(1);
          expect(Ctor).toHaveBeenCalledWith(minMax, minMax, minMax, minMax); // no bias, cannot do more
        })
      ));

    it('Should always bias in valid ranges when using integerLogLike', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b) => {
          // Arrange
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          const Ctor = jest.fn().mockImplementation((newMin, newMax, genMin, genMax) => {
            if (newMin !== min) throw new Error(`Received min=${newMin} !== (expected)${min}`);
            if (newMax !== max) throw new Error(`Received max=${newMax} !== (expected)${max}`);
            if (genMin > genMax) throw new Error(`Received genMin=${genMin} > genMax=${genMax}`);
            if (newMin > genMin) throw new Error(`Received min=${newMin} > genMin=${genMin}`);
            if (newMax < genMax) throw new Error(`Received max=${newMax} < genMax=${genMax}`);
          });

          // Act / Assert
          expect(() => biasNumeric(min, max, Ctor, integerLogLike)).not.toThrow();
        })
      ));

    if (typeof BigInt !== 'undefined') {
      it('Should always bias in valid ranges when using bigIntLogLike', () =>
        fc.assert(
          fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
            // Arrange
            const min = a < b ? a : b;
            const max = a < b ? b : a;
            const Ctor = jest.fn().mockImplementation((newMin, newMax, genMin, genMax) => {
              if (newMin !== min) throw new Error(`Received min=${newMin} !== (expected)${min}`);
              if (newMax !== max) throw new Error(`Received max=${newMax} !== (expected)${max}`);
              if (genMin > genMax) throw new Error(`Received genMin=${genMin} > genMax=${genMax}`);
              if (newMin > genMin) throw new Error(`Received min=${newMin} > genMin=${genMin}`);
              if (newMax < genMax) throw new Error(`Received max=${newMax} < genMax=${genMax}`);
            });

            // Act / Assert
            expect(() => biasNumeric(min, max, Ctor, bigIntLogLike)).not.toThrow();
          })
        ));
    }
  });
});

// Helpers

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      toBeWithinRange(a: number, b: number);
    }
  }
}
