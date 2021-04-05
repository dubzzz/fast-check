import { tuple as tupleOld } from '../../../../src/check/arbitrary/TupleArbitrary';

import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';

import * as stubRng from '../../stubs/generators';

import { fakeNextArbitrary } from './generic/NextArbitraryHelpers';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';
import { Stream } from '../../../../src/stream/Stream';

const mrngNoCall = stubRng.mutable.nocall();
function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: NextArbitrary<Ts[K]> }): NextArbitrary<Ts> {
  const oldArbs = arbs.map((arb) => convertFromNext(arb)) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  return convertToNext(tupleOld<Ts>(...oldArbs));
}

describe('tuple', () => {
  describe('generate', () => {
    it('should merge results coming from underlyings and call them with the exact same inputs as the received ones', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const vA = Symbol();
      const vB = Symbol();
      const vC = Symbol();
      const { instance: instanceA, generate: generateA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, generate: generateB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, generate: generateC } = fakeNextArbitrary<symbol>();
      generateA.mockReturnValueOnce(new NextValue(vA));
      generateB.mockReturnValueOnce(new NextValue(vB));
      generateC.mockReturnValueOnce(new NextValue(vC));

      // Act
      const arb = tuple(instanceA, instanceB, instanceC);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g.value).toEqual([vA, vB, vC]);
      expect(generateA).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
      expect(generateB).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
      expect(generateC).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
    });

    it('should produce a cloneable instance if provided one cloneable underlying', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: jest.fn() })));

      // Act
      const arb = tuple(fakeArbitraryNotCloneableA, fakeArbitraryCloneableB);
      const g = arb.generate(mrngNoCall, undefined);

      // Assert
      expect(g.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(g.value)).toBe(true);
    });

    it('should not produce a cloneable instance if no cloneable underlyings', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryNotCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue([]));

      // Act
      const arb = tuple(fakeArbitraryNotCloneableA, fakeArbitraryNotCloneableB);
      const g = arb.generate(mrngNoCall, undefined);

      // Assert
      expect(g.hasToBeCloned).toBe(false);
      expect(hasCloneMethod(g.value)).toBe(false);
    });

    it('should not clone cloneable on generate', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      const cloneMethodImpl = jest.fn();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })));

      // Act
      const arb = tuple(fakeArbitraryNotCloneableA, fakeArbitraryCloneableB);
      arb.generate(mrngNoCall, undefined);

      // Assert
      expect(cloneMethodImpl).not.toHaveBeenCalled();
    });
  });

  describe('canGenerate', () => {
    it.each`
      canA     | canB     | canC
      ${false} | ${false} | ${false}
      ${false} | ${true}  | ${true}
      ${true}  | ${false} | ${true}
      ${true}  | ${true}  | ${false}
      ${true}  | ${true}  | ${true}
    `(
      'should merge results coming from underlyings for canGenerate if received array has the right size',
      ({ canA, canB, canC }) => {
        // Arrange
        const vA = Symbol();
        const vB = Symbol();
        const vC = Symbol();
        const { instance: instanceA, canGenerate: canGenerateA } = fakeNextArbitrary<symbol>();
        const { instance: instanceB, canGenerate: canGenerateB } = fakeNextArbitrary<symbol>();
        const { instance: instanceC, canGenerate: canGenerateC } = fakeNextArbitrary<symbol>();
        canGenerateA.mockReturnValueOnce(canA);
        canGenerateB.mockReturnValueOnce(canB);
        canGenerateC.mockReturnValueOnce(canC);

        // Act
        const arb = tuple(instanceA, instanceB, instanceC);
        const out = arb.canGenerate([vA, vB, vC]);

        // Assert
        expect(out).toBe(canA && canB && canC);
        expect(canGenerateA).toHaveBeenCalledWith(vA);
        if (canA) expect(canGenerateB).toHaveBeenCalledWith(vB);
        else expect(canGenerateB).not.toHaveBeenCalled();
        if (canA && canB) expect(canGenerateC).toHaveBeenCalledWith(vC);
        else expect(canGenerateC).not.toHaveBeenCalled();
      }
    );

    it('should not call underlyings on canGenerate if size is invalid', () => {
      // Arrange
      const { instance: instanceA, canGenerate: canGenerateA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, canGenerate: canGenerateB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, canGenerate: canGenerateC } = fakeNextArbitrary<symbol>();

      // Act
      const arb = tuple(instanceA, instanceB, instanceC);
      const out = arb.canGenerate([Symbol(), Symbol(), Symbol(), Symbol()]);

      // Assert
      expect(out).toBe(false);
      expect(canGenerateA).not.toHaveBeenCalled();
      expect(canGenerateB).not.toHaveBeenCalled();
      expect(canGenerateC).not.toHaveBeenCalled();
    });
  });

  describe('shrink', () => {
    it('should call back arbitraries on shrink with the initially returned contextq', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const vA = Symbol();
      const vB = Symbol();
      const vC = Symbol();
      const contextA = Symbol();
      const contextB = Symbol();
      const contextC = Symbol();
      const { instance: instanceA, generate: generateA, shrink: shrinkA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, generate: generateB, shrink: shrinkB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, generate: generateC, shrink: shrinkC } = fakeNextArbitrary<symbol>();
      generateA.mockReturnValueOnce(new NextValue(vA, contextA));
      generateB.mockReturnValueOnce(new NextValue(vB, contextB));
      generateC.mockReturnValueOnce(new NextValue(vC, contextC));
      const shrinkA1 = Symbol();
      const shrinkA2 = Symbol();
      const shrinkB1 = Symbol();
      const shrinkC1 = Symbol();
      const shrinkC2 = Symbol();
      const shrinkC3 = Symbol();
      shrinkA.mockReturnValueOnce(Stream.of(new NextValue(shrinkA1 as symbol), new NextValue(shrinkA2)));
      shrinkB.mockReturnValueOnce(Stream.of(new NextValue(shrinkB1 as symbol)));
      shrinkC.mockReturnValueOnce(
        Stream.of(new NextValue(shrinkC1 as symbol), new NextValue(shrinkC2), new NextValue(shrinkC3))
      );

      // Act
      const arb = tuple(instanceA, instanceB, instanceC);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrinks = [...arb.shrink(g.value, g.context)];

      // Assert
      expect(shrinks).toHaveLength(2 /* A */ + 1 /* B */ + 3 /* C */);
      expect(shrinks.map((v) => v.value)).toEqual([
        [shrinkA1, vB, vC],
        [shrinkA2, vB, vC],
        [vA, shrinkB1, vC],
        [vA, vB, shrinkC1],
        [vA, vB, shrinkC2],
        [vA, vB, shrinkC3],
      ]);
      expect(shrinkA).toHaveBeenCalledWith(vA, contextA);
      expect(shrinkB).toHaveBeenCalledWith(vB, contextB);
      expect(shrinkC).toHaveBeenCalledWith(vC, contextC);
    });

    it('should clone cloneable on shrink', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA, shrink: shrinkA } = fakeNextArbitrary<
        string[]
      >();
      const { instance: fakeArbitraryCloneableB, generate: generateB, shrink: shrinkB } = fakeNextArbitrary<string[]>();

      const { instance: fakeArbitraryNotCloneableC, generate: generateC, shrink: shrinkC } = fakeNextArbitrary<
        string[]
      >();
      const cloneMethodImpl = jest
        .fn()
        .mockImplementation(() => Object.defineProperty([], cloneMethod, { value: cloneMethodImpl }));
      generateA.mockReturnValue(new NextValue([]));
      shrinkA.mockReturnValue(Stream.of(new NextValue([]), new NextValue([])));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })));
      shrinkB.mockReturnValue(
        Stream.of(
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })),
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })),
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl }))
        )
      );
      generateC.mockReturnValue(new NextValue([]));
      shrinkC.mockReturnValue(Stream.of(new NextValue([]), new NextValue([]), new NextValue([]), new NextValue([])));

      // Act
      const arb = tuple(fakeArbitraryNotCloneableA, fakeArbitraryCloneableB, fakeArbitraryNotCloneableC);
      const g = arb.generate(mrngNoCall, undefined);
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      const shrinkLazy = arb.shrink(g.value, g.context);
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      const shrinks = [...shrinkLazy];

      // Assert
      expect(shrinks).toHaveLength(2 /* A */ + 3 /* B */ + 4 /* C */);
      expect(cloneMethodImpl).toHaveBeenCalledTimes(shrinks.length);
    });
  });
});
