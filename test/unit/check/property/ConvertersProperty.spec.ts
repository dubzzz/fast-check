import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { INextRawProperty } from '../../../../src/check/property/INextRawProperty';
import { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import { convertFromNextProperty, convertToNextProperty } from '../../../../src/check/property/ConvertersProperty';

describe('Converters (integration)', () => {
  it('should return the original instance of IRawProperty when calling convertFromNextProperty(convertToNextProperty)', () => {
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
    const transformedInstance = convertFromNextProperty(convertToNextProperty(originalInstance));

    // Assert
    expect(transformedInstance).toBe(originalInstance);
  });

  it('should return the original instance of IRawNextProperty when calling convertToNextProperty(convertFromNextProperty)', () => {
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
    const transformedInstance = convertToNextProperty(convertFromNextProperty(originalInstance));

    // Assert
    expect(transformedInstance).toBe(originalInstance);
  });
});
