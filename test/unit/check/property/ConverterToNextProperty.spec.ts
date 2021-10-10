import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { INextRawProperty } from '../../../../src/check/property/INextRawProperty';
import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { ConverterToNextProperty } from '../../../../src/check/property/ConverterToNextProperty';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';

describe('ConverterToNextProperty', () => {
  describe('isConverterToNext', () => {
    it('should detect its own instances', () => {
      // Arrange
      class MyProperty implements IRawProperty<number, false> {
        isAsync(): false {
          throw new Error('Method not implemented.');
        }
        generate(_mrng: Random, _runId?: number): Shrinkable<number, number> {
          throw new Error('Method not implemented.');
        }
        run(_v: number): string | PreconditionFailure {
          throw new Error('Method not implemented.');
        }
      }
      const originalInstance = new MyProperty();

      // Act
      const transformedInstance = new ConverterToNextProperty(originalInstance);

      // Assert
      expect(ConverterToNextProperty.isConverterToNext(transformedInstance)).toBe(true);
    });

    it('should not consider instances of INextRawProperty as its own instances', () => {
      // Arrange
      class MyNextProperty implements INextRawProperty<number, false> {
        isAsync(): false {
          throw new Error('Method not implemented.');
        }
        generate(_mrng: Random, _runId?: number): NextValue<number> {
          throw new Error('Method not implemented.');
        }
        shrink(_value: NextValue<number>): Stream<NextValue<number>> {
          throw new Error('Method not implemented.');
        }
        run(_v: number): string | PreconditionFailure {
          throw new Error('Method not implemented.');
        }
      }

      // Act
      const originalInstance = new MyNextProperty();

      // Assert
      expect(ConverterToNextProperty.isConverterToNext(originalInstance)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should be able to use the underlying property to build values', () => {
      // Arrange
      const runId = 123;
      const expectedValue = Symbol();
      const isAsync = jest.fn();
      const generate = jest.fn().mockReturnValueOnce(new Shrinkable(expectedValue));
      const run = jest.fn();
      class MyProperty implements IRawProperty<number, false> {
        isAsync = isAsync;
        generate = generate;
        run = run;
      }
      const originalInstance = new MyProperty();
      const { instance: mrng } = fakeRandom();

      // Act
      const transformedInstance = new ConverterToNextProperty(originalInstance);
      const out = transformedInstance.generate(mrng, runId);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledWith(mrng, runId);
    });
  });

  describe('shrink', () => {
    it('should be able to shrink values produced by generate', () => {
      // Arrange
      const runId = 123;
      const expectedValue = Symbol();
      const expectedShrink1 = Symbol();
      const expectedShrink2 = Symbol();
      const shrinkable = new Shrinkable<symbol>(expectedValue, () =>
        Stream.of<Shrinkable<symbol>>(new Shrinkable(expectedShrink1), new Shrinkable(expectedShrink2))
      );
      const isAsync = jest.fn();
      const generate = jest.fn().mockReturnValueOnce(shrinkable);
      const run = jest.fn();
      class MyProperty implements IRawProperty<number, false> {
        isAsync = isAsync;
        generate = generate;
        run = run;
      }
      const originalInstance = new MyProperty();
      const { instance: mrng } = fakeRandom();

      // Act
      const transformedInstance = new ConverterToNextProperty(originalInstance);
      const value = transformedInstance.generate(mrng, runId);
      const shrinks = transformedInstance.shrink(value);

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([expectedShrink1, expectedShrink2]);
    });

    it('should be able to shrink values produced by shrink', () => {
      // Arrange
      const runId = 123;
      const expectedValue = Symbol();
      const expectedShrink1 = Symbol();
      const expectedShrink2 = Symbol();
      const expectedShrink21 = Symbol();
      const shrinkable = new Shrinkable<symbol>(expectedValue, () =>
        Stream.of<Shrinkable<symbol>>(
          new Shrinkable(expectedShrink1),
          new Shrinkable<symbol>(expectedShrink2, () => Stream.of<Shrinkable<symbol>>(new Shrinkable(expectedShrink21)))
        )
      );
      const isAsync = jest.fn();
      const generate = jest.fn().mockReturnValueOnce(shrinkable);
      const run = jest.fn();
      class MyProperty implements IRawProperty<number, false> {
        isAsync = isAsync;
        generate = generate;
        run = run;
      }
      const originalInstance = new MyProperty();
      const { instance: mrng } = fakeRandom();

      // Act
      const transformedInstance = new ConverterToNextProperty(originalInstance);
      const value = transformedInstance.generate(mrng, runId);
      const shrink2Value = transformedInstance.shrink(value).getNthOrLast(1)!;
      const shrinks = transformedInstance.shrink(shrink2Value);

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([expectedShrink21]);
    });
  });
});
