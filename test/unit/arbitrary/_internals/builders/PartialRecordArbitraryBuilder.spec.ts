import { fakeNextArbitrary } from '../../__test-helpers__/NextArbitraryHelpers';
import { convertFromNext, convertToNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { buildPartialRecordArbitrary } from '../../../../../src/arbitrary/_internals/builders/PartialRecordArbitraryBuilder';

import * as OptionMock from '../../../../../src/arbitrary/option';
import * as TupleMock from '../../../../../src/arbitrary/tuple';
import * as ValuesAndSeparateKeysToObjectMock from '../../../../../src/arbitrary/_internals/mappers/ValuesAndSeparateKeysToObject';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('buildPartialRecordArbitrary', () => {
  it('should never wrap arbitraries linked to required keys and forward all keys to mappers', () => {
    // Arrange
    const { instance: mappedInstance } = fakeNextArbitrary<any>();
    const { instance: tupleInstance, map } = fakeNextArbitrary<any[]>();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    tuple.mockReturnValue(convertFromNext(tupleInstance));
    map.mockReturnValue(mappedInstance);

    const mapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectMapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectMapper'
    );
    buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

    const unmapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectUnmapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectUnmapper'
    );
    buildValuesAndSeparateKeysToObjectUnmapper.mockReturnValue(unmapper);

    const arbKey1 = fakeNextArbitrary();
    const arbKey2 = fakeNextArbitrary();
    const recordModel = {
      a: convertFromNext(arbKey1),
      b: convertFromNext(arbKey2),
    };
    const requiredKeys: (keyof typeof recordModel)[] = ['a', 'b'];
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(convertToNext(arb)).toBe(mappedInstance);
    expect(option).not.toHaveBeenCalled();
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });

  it('should wrap arbitraries not linked to required keys into option and forward all keys to mappers', () => {
    // Arrange
    const { instance: mappedInstance } = fakeNextArbitrary<any>();
    const { instance: tupleInstance, map } = fakeNextArbitrary<any[]>();
    const { instance: optionInstance1 } = fakeNextArbitrary();
    const { instance: optionInstance2 } = fakeNextArbitrary();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    const optionInstance1Old = convertFromNext(optionInstance1);
    const optionInstance2Old = convertFromNext(optionInstance2);
    option.mockReturnValueOnce(optionInstance1Old).mockReturnValueOnce(optionInstance2Old);
    tuple.mockReturnValue(convertFromNext(tupleInstance));
    map.mockReturnValue(mappedInstance);

    const mapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectMapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectMapper'
    );
    buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

    const unmapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectUnmapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectUnmapper'
    );
    buildValuesAndSeparateKeysToObjectUnmapper.mockReturnValue(unmapper);

    const arbKey1 = fakeNextArbitrary();
    const arbKey2 = fakeNextArbitrary();
    const arbKey3 = fakeNextArbitrary();
    const recordModel = {
      a: convertFromNext(arbKey1),
      b: convertFromNext(arbKey2),
      c: convertFromNext(arbKey3),
    };
    const requiredKeys: (keyof typeof recordModel)[] = ['b'];
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b', 'c'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(convertToNext(arb)).toBe(mappedInstance);
    expect(option).toHaveBeenCalledTimes(2);
    expect(option).toHaveBeenCalledWith(recordModel.a, { nil: expect.any(Symbol) });
    expect(option).toHaveBeenCalledWith(recordModel.c, { nil: expect.any(Symbol) });
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(optionInstance1Old, recordModel.b, optionInstance2Old);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });

  it('should not wrap any arbitrary when required keys is not specified (all required) and forward all keys to mappers', () => {
    // Arrange
    const { instance: mappedInstance } = fakeNextArbitrary<any>();
    const { instance: tupleInstance, map } = fakeNextArbitrary<any[]>();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    tuple.mockReturnValue(convertFromNext(tupleInstance));
    map.mockReturnValue(mappedInstance);

    const mapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectMapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectMapper'
    );
    buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

    const unmapper = jest.fn();
    const buildValuesAndSeparateKeysToObjectUnmapper = jest.spyOn(
      ValuesAndSeparateKeysToObjectMock,
      'buildValuesAndSeparateKeysToObjectUnmapper'
    );
    buildValuesAndSeparateKeysToObjectUnmapper.mockReturnValue(unmapper);

    const arbKey1 = fakeNextArbitrary();
    const arbKey2 = fakeNextArbitrary();
    const recordModel = {
      a: convertFromNext(arbKey1),
      b: convertFromNext(arbKey2),
    };
    const requiredKeys = undefined;
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(convertToNext(arb)).toBe(mappedInstance);
    expect(option).not.toHaveBeenCalled();
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });
});
