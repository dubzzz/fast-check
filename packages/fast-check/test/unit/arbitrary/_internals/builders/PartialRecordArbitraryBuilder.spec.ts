import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers';
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
    const { instance: mappedInstance } = fakeArbitrary<any>();
    const { instance: tupleInstance, map } = fakeArbitrary<any[]>();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    tuple.mockReturnValue(tupleInstance);
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

    const arbKey1 = fakeArbitrary();
    const arbKey2 = fakeArbitrary();
    const recordModel = {
      a: arbKey1,
      b: arbKey2,
    };
    const requiredKeys: (keyof typeof recordModel)[] = ['a', 'b'];
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(arb).toBe(mappedInstance);
    expect(option).not.toHaveBeenCalled();
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });

  it('should wrap arbitraries not linked to required keys into option and forward all keys to mappers', () => {
    // Arrange
    const { instance: mappedInstance } = fakeArbitrary<any>();
    const { instance: tupleInstance, map } = fakeArbitrary<any[]>();
    const { instance: optionInstance1 } = fakeArbitrary();
    const { instance: optionInstance2 } = fakeArbitrary();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    const optionInstance1Old = optionInstance1;
    const optionInstance2Old = optionInstance2;
    option.mockReturnValueOnce(optionInstance1Old).mockReturnValueOnce(optionInstance2Old);
    tuple.mockReturnValue(tupleInstance);
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

    const arbKey1 = fakeArbitrary();
    const arbKey2 = fakeArbitrary();
    const arbKey3 = fakeArbitrary();
    const recordModel = {
      a: arbKey1,
      b: arbKey2,
      c: arbKey3,
    };
    const requiredKeys: (keyof typeof recordModel)[] = ['b'];
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b', 'c'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(arb).toBe(mappedInstance);
    expect(option).toHaveBeenCalledTimes(2);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(option).toHaveBeenCalledWith(recordModel.a, { nil: expect.any(Symbol as any) });
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(option).toHaveBeenCalledWith(recordModel.c, { nil: expect.any(Symbol as any) });
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(optionInstance1Old, recordModel.b, optionInstance2Old);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });

  it('should not wrap any arbitrary when required keys is not specified (all required) and forward all keys to mappers', () => {
    // Arrange
    const { instance: mappedInstance } = fakeArbitrary<any>();
    const { instance: tupleInstance, map } = fakeArbitrary<any[]>();
    const option = jest.spyOn(OptionMock, 'option');
    const tuple = jest.spyOn(TupleMock, 'tuple');
    tuple.mockReturnValue(tupleInstance);
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

    const arbKey1 = fakeArbitrary();
    const arbKey2 = fakeArbitrary();
    const recordModel = {
      a: arbKey1,
      b: arbKey2,
    };
    const requiredKeys = undefined;
    const allKeys: (keyof typeof recordModel)[] = ['a', 'b'];

    // Act
    const arb = buildPartialRecordArbitrary(recordModel, requiredKeys);

    // Assert
    expect(arb).toBe(mappedInstance);
    expect(option).not.toHaveBeenCalled();
    expect(tuple).toHaveBeenCalledTimes(1);
    expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
    // Typing issue of expect.any() - see DefinitelyTyped/DefinitelyTyped#62831
    expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol as any));
    expect(map).toHaveBeenCalledTimes(1);
    expect(map).toHaveBeenCalledWith(mapper, unmapper);
  });
});
