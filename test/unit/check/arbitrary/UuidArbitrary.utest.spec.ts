import { uuid, uuidV } from '../../../../src/check/arbitrary/UuidArbitrary';
import * as stubRng from '../../stubs/generators';
import { mockModule } from './generic/MockedModule';

jest.mock('../../../../src/check/arbitrary/IntegerArbitrary');
jest.mock('../../../../src/check/arbitrary/TupleArbitrary');
import * as IntegerArbitraryMock from '../../../../src/check/arbitrary/IntegerArbitrary';
import * as TupleArbitraryMock from '../../../../src/check/arbitrary/TupleArbitrary';
import { arbitraryFor } from './generic/ArbitraryBuilder';

const mrng = () => stubRng.mutable.nocall();

describe('UuidArbitrary', () => {
  describe('uuid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should be able to build the smallest uuid', () => {
      // Arrange
      const { nat, integer } = mockModule(IntegerArbitraryMock);
      const { tuple } = mockModule(TupleArbitraryMock);
      nat.mockImplementation(() => arbitraryFor([{ value: 0 }, { value: 0 }, { value: 0 }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: a }]));
      tuple.mockImplementation((...arbs) => arbitraryFor([{ value: arbs.map(a => a.generate(mrng()).value_) as any }]));

      // Act
      const arb = uuid();
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`00000000-0000-1000-8000-000000000000`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
    it('Should be able to build the largest uuid', () => {
      // Arrange
      const { nat, integer } = mockModule(IntegerArbitraryMock);
      const { tuple } = mockModule(TupleArbitraryMock);
      nat.mockImplementation(a => arbitraryFor([{ value: a }, { value: a }, { value: a }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: b }]));
      tuple.mockImplementation((...arbs) => arbitraryFor([{ value: arbs.map(a => a.generate(mrng()).value_) as any }]));

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
      const { nat, integer } = mockModule(IntegerArbitraryMock);
      const { tuple } = mockModule(TupleArbitraryMock);
      nat.mockImplementation(() => arbitraryFor([{ value: 0 }, { value: 0 }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: a }]));
      tuple.mockImplementation((...arbs) => arbitraryFor([{ value: arbs.map(a => a.generate(mrng()).value_) as any }]));

      // Act
      const arb = uuidV(3);
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`00000000-0000-3000-8000-000000000000`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
    it('Should be able to build the largest versioned uuid', () => {
      // Arrange
      const { nat, integer } = mockModule(IntegerArbitraryMock);
      const { tuple } = mockModule(TupleArbitraryMock);
      nat.mockImplementation(a => arbitraryFor([{ value: a }, { value: a }]));
      integer.mockImplementation((a, b) => arbitraryFor([{ value: b }]));
      tuple.mockImplementation((...arbs) => arbitraryFor([{ value: arbs.map(a => a.generate(mrng()).value_) as any }]));

      // Act
      const arb = uuidV(3);
      const { value_: u } = arb.generate(mrng());

      // Assert
      expect(u).toBe(`ffffffff-ffff-3fff-bfff-ffffffffffff`);
      expect(tuple).toHaveBeenCalledTimes(1);
    });
  });
});
