import * as fc from '../../../../lib/fast-check';
import { StreamArbitrary } from '../../../../src/arbitrary/_internals/StreamArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { cloneIfNeeded, hasCloneMethod } from '../../../../src/check/symbols';
import { Stream } from '../../../../src/stream/Stream';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import { FakeIntegerArbitrary, fakeNextArbitrary } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';

import * as StringifyMock from '../../../../src/utils/stringify';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('StreamArbitrary', () => {
  describe('generate', () => {
    it('should produce a cloneable instance of Stream', () => {
      // Arrange
      const biasFactor = 48;
      const { instance: sourceArb } = fakeNextArbitrary();
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const out = arb.generate(mrng, biasFactor);

      // Assert
      expect(out.value).toBeInstanceOf(Stream);
      expect(out.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(out.value)).toBe(true);
    });

    it('should not call generate before we pull from the Stream but decide bias', () => {
      // Arrange
      const biasFactor = 48;
      const { instance: sourceArb, generate } = fakeNextArbitrary();
      const { instance: mrng, nextInt } = fakeRandom();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      arb.generate(mrng, biasFactor).value;

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(1);
      expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
      expect(generate).not.toHaveBeenCalled();
    });

    it('should not check bias again for cloned instances', () => {
      // Arrange
      const biasFactor = 48;
      const { instance: sourceArb } = fakeNextArbitrary();
      const { instance: mrng, nextInt } = fakeRandom();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const out = arb.generate(mrng, biasFactor);
      const s1 = out.value;
      const s2 = out.value;

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(1);
      expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
      expect(s2).not.toBe(s1);
    });

    it('should call generate with cloned instance of Random as we pull from the Stream', () => {
      // Arrange
      const numValuesToPull = 5;
      const biasFactor = 48;
      let index = 0;
      const expectedValues = [...Array(numValuesToPull)].map(() => Symbol());
      const { instance: sourceArb, generate } = fakeNextArbitrary();
      generate.mockImplementation(() => new NextValue(expectedValues[index++]));
      const { instance: mrng, clone, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(1); // for bias
      const { instance: mrngCloned } = fakeRandom();
      clone.mockReturnValueOnce(mrngCloned);

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const stream = arb.generate(mrng, biasFactor).value;
      const cursor = stream[Symbol.iterator]();
      const values: unknown[] = [];
      for (let i = 0; i !== numValuesToPull; ++i) {
        const next = cursor.next();
        expect(next.done).toBe(false);
        values.push(next.value);
      }

      // Assert
      expect(generate).toHaveBeenCalledTimes(numValuesToPull);
      for (const call of generate.mock.calls) {
        expect(call).toEqual([mrngCloned, biasFactor]);
      }
      expect(values).toEqual(expectedValues);
    });

    it('should call generate with cloned instance of Random specific for each Stream', () => {
      // Arrange
      const numValuesToPullS1 = 5;
      const numValuesToPullS2 = 3;
      const biasFactor = 48;
      const { instance: sourceArb, generate } = fakeNextArbitrary();
      generate.mockImplementation(() => new NextValue(Symbol()));
      const { instance: mrng, clone, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(1); // for bias
      const { instance: mrngClonedA } = fakeRandom();
      const { instance: mrngClonedB } = fakeRandom();
      clone.mockReturnValueOnce(mrngClonedA).mockReturnValueOnce(mrngClonedB);

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const out = arb.generate(mrng, biasFactor);
      const s1 = out.value;
      const c1 = s1[Symbol.iterator]();
      for (let i = 0; i !== numValuesToPullS1; ++i) {
        const next = c1.next();
        expect(next.done).toBe(false);
      }
      const s2 = out.value;
      const c2 = s2[Symbol.iterator]();
      for (let i = 0; i !== numValuesToPullS2; ++i) {
        const next = c2.next();
        expect(next.done).toBe(false);
      }
      c1.next();

      // Assert
      expect(generate).toHaveBeenCalledTimes(numValuesToPullS1 + numValuesToPullS2 + 1);
      const calls = generate.mock.calls;
      for (let i = 0; i !== numValuesToPullS1; ++i) {
        const call = calls[i];
        expect(call).toEqual([mrngClonedA, biasFactor]);
      }
      for (let i = 0; i !== numValuesToPullS2; ++i) {
        const call = calls[numValuesToPullS1 + i];
        expect(call).toEqual([mrngClonedB, biasFactor]);
      }
      expect(calls[numValuesToPullS1 + numValuesToPullS2]).toEqual([mrngClonedA, biasFactor]);
    });

    it('should only print pulled values on print', () =>
      fc.assert(
        fc.property(fc.array(fc.integer()), (expectedValues) => {
          // Arrange
          const biasFactor = 48;
          let index = 0;
          const { instance: sourceArb, generate } = fakeNextArbitrary<number>();
          generate.mockImplementation(() => new NextValue(expectedValues[index++]));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(2); // for no bias
          const { instance: mrngCloned } = fakeRandom();
          clone.mockReturnValueOnce(mrngCloned);
          const fakeStringify = (v: unknown) => '<' + String(v) + '>';
          const stringify = jest.spyOn(StringifyMock, 'stringify');
          stringify.mockImplementation(fakeStringify);

          // Act
          const arb = new StreamArbitrary(sourceArb);
          const stream = arb.generate(mrng, biasFactor).value;
          const cursor = stream[Symbol.iterator]();
          const values: unknown[] = [];
          for (let i = 0; i !== expectedValues.length; ++i) {
            const next = cursor.next();
            expect(next.done).toBe(false);
            values.push(next.value);
          }

          // Assert
          expect(values).toEqual(expectedValues);
          expect(String(stream)).toEqual(`Stream(${expectedValues.map(fakeStringify).join(',')}…)`);
          expect(stringify).toHaveBeenCalledTimes(expectedValues.length);
          expect(generate).toHaveBeenCalledTimes(expectedValues.length);
          if (expectedValues.length > 0) {
            expect(generate).toHaveBeenCalledWith(mrngCloned, undefined);
          }
        })
      ));
  });

  describe('canGenerate', () => {
    function* infiniteG() {
      yield 1;
    }
    it.each`
      data                         | description
      ${Stream.nil()}              | ${'empty stream'}
      ${Stream.of(1, 5, 6, 74, 4)} | ${'finite stream'}
      ${new Stream(infiniteG())}   | ${'infinite stream'}
    `('should return false for any Stream whatever the size ($description)', ({ data }) => {
      // Arrange
      const { instance: sourceArb, canGenerate } = fakeNextArbitrary();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const out = arb.canGenerate(data);

      // Assert
      expect(out).toBe(false);
      expect(canGenerate).not.toHaveBeenCalled();
    });

    it('should return false even for its own values', () => {
      // Arrange
      const { instance: sourceArb, canGenerate } = fakeNextArbitrary();
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const g = arb.generate(mrng, undefined);
      const out = arb.canGenerate(g.value);

      // Assert
      expect(out).toBe(false);
      expect(canGenerate).not.toHaveBeenCalled();
    });
  });

  describe('shrink', () => {
    it('should always shrink to nil', () => {
      // Arrange
      const { instance: sourceArb, generate, shrink } = fakeNextArbitrary<number>();
      generate.mockReturnValue(new NextValue(0));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new StreamArbitrary(sourceArb);
      const { value, context } = arb.generate(mrng, undefined);
      const pullValues = [...value.take(50)];
      const shrinks = [...arb.shrink(value, context)];

      // Assert
      expect(pullValues).toBeDefined();
      expect(shrinks).toHaveLength(0);
      expect(shrink).not.toHaveBeenCalled();
    });
  });
});

describe('StreamArbitrary (integration)', () => {
  const sourceArb = new FakeIntegerArbitrary();

  const isEqual = (s1: Stream<number>, s2: Stream<number>) => {
    expect([...cloneIfNeeded(s1).take(10)]).toEqual([...cloneIfNeeded(s2).take(10)]);
  };

  const isCorrect = (value: Stream<number>) =>
    value instanceof Stream && [...value.take(10)].every((v) => sourceArb.canGenerate(v));

  const streamBuilder = () => new StreamArbitrary(sourceArb);

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(streamBuilder, { isEqual });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(streamBuilder, isCorrect);
  });
});
