import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { INextRawProperty } from '../../../../src/check/property/INextRawProperty';
import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { ConverterFromNextProperty } from '../../../../src/check/property/ConverterFromNextProperty';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import { fakeRandom } from '../../arbitrary/__test-helpers__/RandomHelpers';

describe('ConverterFromNextProperty', () => {
  describe('isConverterFromNext', () => {
    it('should detect its own instances', () => {
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
      const originalInstance = new MyNextProperty();

      // Act
      const transformedInstance = new ConverterFromNextProperty(originalInstance);

      // Assert
      expect(ConverterFromNextProperty.isConverterFromNext(transformedInstance)).toBe(true);
    });

    it('should not consider instances of IRawProperty as its own instances', () => {
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

      // Act
      const originalInstance = new MyProperty();

      // Assert
      expect(ConverterFromNextProperty.isConverterFromNext(originalInstance)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should be able to use the underlying property to build values', () => {
      // Arrange
      const runId = 123;
      const expectedValue = Symbol();
      const isAsync = jest.fn();
      const generate = jest.fn().mockReturnValueOnce(new NextValue(expectedValue, undefined));
      const shrink = jest.fn();
      const run = jest.fn();
      class MyNextProperty implements INextRawProperty<number, false> {
        isAsync = isAsync;
        generate = generate;
        shrink = shrink;
        run = run;
      }
      const originalInstance = new MyNextProperty();
      const { instance: mrng } = fakeRandom();

      // Act
      const transformedInstance = new ConverterFromNextProperty(originalInstance);
      const out = transformedInstance.generate(mrng, runId);

      // Assert
      expect(out.value).toBe(expectedValue);
      expect(generate).toHaveBeenCalledWith(mrng, runId);
    });

    it('should call shrink of the source property on shrink', () => {
      // Arrange
      const runId = 123;
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const expectedNextValue = new NextValue(expectedValue, expectedContext);
      const expectedShrink1 = Symbol();
      const expectedShrink2 = Symbol();
      const isAsync = jest.fn();
      const generate = jest.fn().mockReturnValueOnce(expectedNextValue);
      const shrink = jest
        .fn()
        .mockReturnValue(
          Stream.of<Shrinkable<symbol>>(new Shrinkable(expectedShrink1), new Shrinkable(expectedShrink2))
        );
      const run = jest.fn();
      class MyNextProperty implements INextRawProperty<number, false> {
        isAsync = isAsync;
        generate = generate;
        shrink = shrink;
        run = run;
      }
      const originalInstance = new MyNextProperty();
      const { instance: mrng } = fakeRandom();

      // Act
      const transformedInstance = new ConverterFromNextProperty(originalInstance);
      const shrinkable = transformedInstance.generate(mrng, runId);
      expect(shrink).not.toHaveBeenCalled();
      const shrinks = shrinkable.shrink();

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([expectedShrink1, expectedShrink2]);
      expect(shrink).toHaveBeenCalledWith(expectedNextValue);
    });
  });
});
