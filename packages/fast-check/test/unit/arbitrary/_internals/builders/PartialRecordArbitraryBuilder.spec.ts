import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers';
import { buildPartialRecordArbitrary } from '../../../../../src/arbitrary/_internals/builders/PartialRecordArbitraryBuilder';

import * as BooleanMock from '../../../../../src/arbitrary/boolean';
import * as ConstantMock from '../../../../../src/arbitrary/constant';
import * as OptionMock from '../../../../../src/arbitrary/option';
import * as TupleMock from '../../../../../src/arbitrary/tuple';
import * as ValuesAndSeparateKeysToObjectMock from '../../../../../src/arbitrary/_internals/mappers/ValuesAndSeparateKeysToObject';

function beforeEachHook() {
  vi.resetModules();
  vi.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('buildPartialRecordArbitrary', () => {
  it.each([{ noNullPrototype: true }, { noNullPrototype: false }])(
    'should never wrap arbitraries linked to required keys and forward all keys to mappers (noNullPrototype: $noNullPrototype)',
    ({ noNullPrototype }) => {
      // Arrange
      const { instance: mappedInstance } = fakeArbitrary<any>();
      const { instance: tupleInstance } = fakeArbitrary<any[]>();
      const { instance: tupleInstance2, map } = fakeArbitrary<any[]>();
      const { instance: booleanInstance } = fakeArbitrary<any>();
      const boolean = vi.spyOn(BooleanMock, 'boolean');
      const constant = vi.spyOn(ConstantMock, 'constant');
      const option = vi.spyOn(OptionMock, 'option');
      const tuple = vi.spyOn(TupleMock, 'tuple');
      boolean.mockReturnValueOnce(booleanInstance);
      constant.mockReturnValueOnce(booleanInstance);
      tuple.mockReturnValueOnce(tupleInstance).mockReturnValueOnce(tupleInstance2);
      map.mockReturnValueOnce(mappedInstance);

      const mapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectMapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectMapper',
      );
      buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

      const unmapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectUnmapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectUnmapper',
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
      const arb = buildPartialRecordArbitrary(recordModel, requiredKeys, noNullPrototype);

      // Assert
      expect(arb).toBe(mappedInstance);
      expect(option).not.toHaveBeenCalled();
      expect(tuple).toHaveBeenCalledTimes(2);
      expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
      expect(tuple).toHaveBeenCalledWith(tupleInstance, booleanInstance);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(map).toHaveBeenCalledTimes(1);
      expect(map).toHaveBeenCalledWith(mapper, unmapper);
      if (noNullPrototype) {
        expect(boolean).not.toHaveBeenCalled();
        expect(constant).toHaveBeenCalledTimes(1);
        expect(constant).toHaveBeenCalledWith(false); // ie withNullPrototype=false
      } else {
        expect(boolean).toHaveBeenCalledTimes(1);
        expect(constant).not.toHaveBeenCalled();
      }
    },
  );

  it.each([{ noNullPrototype: true }, { noNullPrototype: false }])(
    'should wrap arbitraries not linked to required keys into option and forward all keys to mappers (noNullPrototype: $noNullPrototype)',
    ({ noNullPrototype }) => {
      // Arrange
      const { instance: mappedInstance } = fakeArbitrary<any>();
      const { instance: tupleInstance } = fakeArbitrary<any[]>();
      const { instance: tupleInstance2, map } = fakeArbitrary<any[]>();
      const { instance: booleanInstance } = fakeArbitrary<any>();
      const { instance: optionInstance1 } = fakeArbitrary();
      const { instance: optionInstance2 } = fakeArbitrary();
      const boolean = vi.spyOn(BooleanMock, 'boolean');
      const constant = vi.spyOn(ConstantMock, 'constant');
      const option = vi.spyOn(OptionMock, 'option');
      const tuple = vi.spyOn(TupleMock, 'tuple');
      const optionInstance1Old = optionInstance1;
      const optionInstance2Old = optionInstance2;
      boolean.mockReturnValueOnce(booleanInstance);
      constant.mockReturnValueOnce(booleanInstance);
      option.mockReturnValueOnce(optionInstance1Old).mockReturnValueOnce(optionInstance2Old);
      tuple.mockReturnValueOnce(tupleInstance).mockReturnValueOnce(tupleInstance2);
      map.mockReturnValueOnce(mappedInstance);

      const mapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectMapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectMapper',
      );
      buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

      const unmapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectUnmapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectUnmapper',
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
      const arb = buildPartialRecordArbitrary(recordModel, requiredKeys, noNullPrototype);

      // Assert
      expect(arb).toBe(mappedInstance);
      expect(option).toHaveBeenCalledTimes(2);
      expect(option).toHaveBeenCalledWith(recordModel.a, { nil: expect.any(Symbol) });
      expect(option).toHaveBeenCalledWith(recordModel.c, { nil: expect.any(Symbol) });
      expect(tuple).toHaveBeenCalledTimes(2);
      expect(tuple).toHaveBeenCalledWith(optionInstance1Old, recordModel.b, optionInstance2Old);
      expect(tuple).toHaveBeenCalledWith(tupleInstance, booleanInstance);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(map).toHaveBeenCalledTimes(1);
      expect(map).toHaveBeenCalledWith(mapper, unmapper);
      if (noNullPrototype) {
        expect(boolean).not.toHaveBeenCalled();
        expect(constant).toHaveBeenCalledTimes(1);
        expect(constant).toHaveBeenCalledWith(false); // ie withNullPrototype=false
      } else {
        expect(boolean).toHaveBeenCalledTimes(1);
        expect(constant).not.toHaveBeenCalled();
      }
    },
  );

  it.each([{ noNullPrototype: true }, { noNullPrototype: false }])(
    'should not wrap any arbitrary when required keys is not specified (all required) and forward all keys to mappers (noNullPrototype: $noNullPrototype)',
    ({ noNullPrototype }) => {
      // Arrange
      const { instance: mappedInstance } = fakeArbitrary<any>();
      const { instance: tupleInstance } = fakeArbitrary<any[]>();
      const { instance: tupleInstance2, map } = fakeArbitrary<any[]>();
      const { instance: booleanInstance } = fakeArbitrary<any>();
      const boolean = vi.spyOn(BooleanMock, 'boolean');
      const constant = vi.spyOn(ConstantMock, 'constant');
      const option = vi.spyOn(OptionMock, 'option');
      const tuple = vi.spyOn(TupleMock, 'tuple');
      boolean.mockReturnValueOnce(booleanInstance);
      constant.mockReturnValueOnce(booleanInstance);
      tuple.mockReturnValueOnce(tupleInstance).mockReturnValueOnce(tupleInstance2);
      map.mockReturnValueOnce(mappedInstance);

      const mapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectMapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectMapper',
      );
      buildValuesAndSeparateKeysToObjectMapper.mockReturnValue(mapper);

      const unmapper = vi.fn();
      const buildValuesAndSeparateKeysToObjectUnmapper = vi.spyOn(
        ValuesAndSeparateKeysToObjectMock,
        'buildValuesAndSeparateKeysToObjectUnmapper',
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
      const arb = buildPartialRecordArbitrary(recordModel, requiredKeys, noNullPrototype);

      // Assert
      expect(arb).toBe(mappedInstance);
      expect(option).not.toHaveBeenCalled();
      expect(tuple).toHaveBeenCalledTimes(2);
      expect(tuple).toHaveBeenCalledWith(recordModel.a, recordModel.b);
      expect(tuple).toHaveBeenCalledWith(tupleInstance, booleanInstance);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectMapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledTimes(1);
      expect(buildValuesAndSeparateKeysToObjectUnmapper).toHaveBeenCalledWith(allKeys, expect.any(Symbol));
      expect(map).toHaveBeenCalledTimes(1);
      expect(map).toHaveBeenCalledWith(mapper, unmapper);
      if (noNullPrototype) {
        expect(boolean).not.toHaveBeenCalled();
        expect(constant).toHaveBeenCalledTimes(1);
        expect(constant).toHaveBeenCalledWith(false); // ie withNullPrototype=false
      } else {
        expect(boolean).toHaveBeenCalledTimes(1);
        expect(constant).not.toHaveBeenCalled();
      }
    },
  );
});
