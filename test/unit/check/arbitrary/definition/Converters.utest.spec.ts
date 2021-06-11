import {
  convertFromNext,
  convertFromNextWithShrunkOnce,
  convertToNext,
} from '../../../../../src/check/arbitrary/definition/Converters';
import { mocked } from 'ts-jest/utils';

import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';

import * as ArbitraryMock from '../../../../../src/check/arbitrary/definition/Arbitrary';
import * as NextArbitraryMock from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import * as ConverterFromNextMock from '../../../../../src/check/arbitrary/definition/ConverterFromNext';
import * as ConverterToNextMock from '../../../../../src/check/arbitrary/definition/ConverterToNext';
jest.mock('../../../../../src/check/arbitrary/definition/Arbitrary');
jest.mock('../../../../../src/check/arbitrary/definition/NextArbitrary');
jest.mock('../../../../../src/check/arbitrary/definition/ConverterFromNext');
jest.mock('../../../../../src/check/arbitrary/definition/ConverterToNext');

describe('Converters', () => {
  it('should check the validity of the Arbitrary when performing a conversion with convertToNext', () => {
    // Arrange
    const { assertIsArbitrary } = mocked(ArbitraryMock);
    const { ConverterFromNext } = mocked(ConverterFromNextMock);
    const { ConverterToNext } = mocked(ConverterToNextMock);
    const { isConverterFromNext } = mocked(ConverterFromNext);
    isConverterFromNext.mockReturnValueOnce(false);
    const originalInstance = {} as Arbitrary<any>;

    // Act
    convertToNext(originalInstance);

    // Assert
    expect(isConverterFromNext).toHaveBeenCalledWith(originalInstance);
    expect(assertIsArbitrary).toHaveBeenCalledWith(originalInstance);
    expect(ConverterToNext).toHaveBeenCalledWith(originalInstance);
  });

  it('should check the validity of the Arbitrary when performing a conversion with convertFromNext', () => {
    // Arrange
    const { assertIsNextArbitrary } = mocked(NextArbitraryMock);
    const { ConverterToNext } = mocked(ConverterToNextMock);
    const { ConverterFromNext } = mocked(ConverterFromNextMock);
    const { isConverterToNext } = mocked(ConverterToNext);
    isConverterToNext.mockReturnValueOnce(false);
    const originalInstance = {} as NextArbitrary<any>;

    // Act
    convertFromNext(originalInstance);

    // Assert
    expect(isConverterToNext).toHaveBeenCalledWith(originalInstance);
    expect(assertIsNextArbitrary).toHaveBeenCalledWith(originalInstance);
    expect(ConverterFromNext).toHaveBeenCalledWith(originalInstance);
  });

  it('should check the validity of the Arbitrary when performing a conversion with convertFromNextWithShrunkOnce', () => {
    // Arrange
    const { assertIsNextArbitrary } = mocked(NextArbitraryMock);
    const { ConverterToNext } = mocked(ConverterToNextMock);
    const { ConverterFromNext } = mocked(ConverterFromNextMock);
    const { isConverterToNext } = mocked(ConverterToNext);
    isConverterToNext.mockReturnValueOnce(false);
    const originalInstance = {} as NextArbitrary<any>;
    const legacyShrunkOnceContext = Symbol();

    // Act
    convertFromNextWithShrunkOnce(originalInstance, legacyShrunkOnceContext);

    // Assert
    expect(isConverterToNext).toHaveBeenCalledWith(originalInstance);
    expect(assertIsNextArbitrary).toHaveBeenCalledWith(originalInstance);
    expect(ConverterFromNext).toHaveBeenCalledWith(originalInstance, legacyShrunkOnceContext);
  });
});
