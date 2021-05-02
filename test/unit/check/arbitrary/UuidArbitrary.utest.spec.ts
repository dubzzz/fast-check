import { uuid, uuidV } from '../../../../src/check/arbitrary/UuidArbitrary';
import * as stubRng from '../../stubs/generators';
import { mocked } from 'ts-jest/utils';
import { ArbitraryWithShrink } from '../../../../src/check/arbitrary/definition/ArbitraryWithShrink';

jest.mock('../../../../src/arbitrary/integer');
jest.mock('../../../../src/arbitrary/nat');
jest.mock('../../../../src/arbitrary/tuple');
import * as _IntegerMock from '../../../../src/arbitrary/integer';
import * as _NatMock from '../../../../src/arbitrary/nat';
import * as TupleMock from '../../../../src/arbitrary/tuple';
import { arbitraryFor } from './generic/ArbitraryBuilder';

const IntegerMock: { integer: (min: number, max: number) => ArbitraryWithShrink<number> } = _IntegerMock;
const NatMock: { nat: (max: number) => ArbitraryWithShrink<number> } = _NatMock;

const mrng = () => stubRng.mutable.nocall();

describe('UuidArbitrary', () => {
  describe('uuid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should be able to build the smallest uuid', () => {
      // Arrange
      const { integer } = mocked(IntegerMock);
      const { nat } = mocked(NatMock);
      const { tuple } = mocked(TupleMock);
      nat.mockImplementation(() => arbitraryFor([{ value: 0 }, { value: 0 }, { value: 0 }]));
      integer.mockImplementation((a, _b) => arbitraryFor([{ value: a }]));
      tuple.mockImplementation((...arbs) =>
        arbitraryFor([{ value: arbs.map((a) => a.generate(mrng()).value_) as any }])
      );

      // Act
      const arb = uuid();
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`00000000-0000-1000-8000-000000000000`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
    it('Should be able to build the largest uuid', () => {
      // Arrange
      const { integer } = mocked(IntegerMock);
      const { nat } = mocked(NatMock);
      const { tuple } = mocked(TupleMock);
      nat.mockImplementation((a) => arbitraryFor([{ value: a }, { value: a }, { value: a }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: b }]));
      tuple.mockImplementation((...arbs) =>
        arbitraryFor([{ value: arbs.map((a) => a.generate(mrng()).value_) as any }])
      );

      // Act
      const arb = uuid();
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`ffffffff-ffff-5fff-bfff-ffffffffffff`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
  });
  describe('uuidV', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should be able to build the smallest versioned uuid', () => {
      // Arrange
      const { integer } = mocked(IntegerMock);
      const { nat } = mocked(NatMock);
      const { tuple } = mocked(TupleMock);
      nat.mockImplementation(() => arbitraryFor([{ value: 0 }, { value: 0 }]));
      integer.mockImplementation((a, _b) => arbitraryFor([{ value: a }]));
      tuple.mockImplementation((...arbs) =>
        arbitraryFor([{ value: arbs.map((a) => a.generate(mrng()).value_) as any }])
      );

      // Act
      const arb = uuidV(3);
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`00000000-0000-3000-8000-000000000000`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
    it('Should be able to build the largest versioned uuid', () => {
      // Arrange
      const { integer } = mocked(IntegerMock);
      const { nat } = mocked(NatMock);
      const { tuple } = mocked(TupleMock);
      nat.mockImplementation((a) => arbitraryFor([{ value: a }, { value: a }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: b }]));
      tuple.mockImplementation((...arbs) =>
        arbitraryFor([{ value: arbs.map((a) => a.generate(mrng()).value_) as any }])
      );

      // Act
      const arb = uuidV(3);
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`ffffffff-ffff-3fff-bfff-ffffffffffff`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
  });
});
