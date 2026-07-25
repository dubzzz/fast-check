import { describe, it, expect, vi } from 'vitest';
import { nil } from '../../../../src/utils/iterator.js';
import * as fc from 'fast-check';
import { IteratorArbitrary } from '../../../../src/arbitrary/_internals/IteratorArbitrary.js';
import { Value } from '../../../../src/check/arbitrary/definition/Value.js';
import { cloneIfNeeded, cloneMethod, hasCloneMethod } from '../../../../src/check/symbols.js';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions.js';
import { FakeIntegerArbitrary, fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers.js';
import { fakeRandom } from '../__test-helpers__/RandomHelpers.js';

import * as StringifyMock from '../../../../src/utils/stringify.js';
import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner.js';

describe('IteratorArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should produce a cloneable instance of Iterator', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const biasFactor = 48;
          const { instance: sourceArb } = fakeArbitrary();
          const { instance: mrng } = fakeRandom();

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const out = arb.generate(mrng, biasFactor);

          // Assert
          expect(out.value).toBeInstanceOf(Iterator);
          expect(out.hasToBeCloned).toBe(true);
          expect(hasCloneMethod(out.value)).toBe(true);
        }),
      ));

    it('should not call generate before we pull from the Iterator but decide bias', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const biasFactor = 48;
          const { instance: sourceArb, generate } = fakeArbitrary();
          const { instance: mrng, nextInt } = fakeRandom();

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          // oxlint-disable-next-line no-unused-expressions
          arb.generate(mrng, biasFactor).value;

          // Assert
          expect(nextInt).toHaveBeenCalledTimes(1);
          expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
          expect(generate).not.toHaveBeenCalled();
        }),
      ));

    it('should not check bias again for cloned instances', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const biasFactor = 48;
          const { instance: sourceArb, generate } = fakeArbitrary();
          const internalValue = { [cloneMethod]: () => internalValue };
          generate.mockReturnValue(new Value(internalValue, undefined));
          const { instance: mrng, nextInt } = fakeRandom();

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const out = arb.generate(mrng, biasFactor);
          const s1 = out.value;
          const s2 = out.value;

          // Assert
          expect(nextInt).toHaveBeenCalledTimes(1);
          expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
          if (Object.is(s1, s2)) {
            throw new Error(`We do not expect s1 to be identical to s2`);
          }
        }),
      ));

    it('should call generate with cloned instance of Random as we pull from the Iterator', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const numValuesToPull = 5;
          const biasFactor = 48;
          let index = 0;
          const expectedValues = [...Array(numValuesToPull)].map(() => Symbol());
          const { instance: sourceArb, generate } = fakeArbitrary();
          generate.mockImplementation(() => new Value(expectedValues[index++], undefined));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(1); // for bias
          const { instance: mrngCloned } = fakeRandom();
          clone.mockReturnValueOnce(mrngCloned);

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const iterator = arb.generate(mrng, biasFactor).value;
          const values = [...iterator.take(numValuesToPull)];

          // Assert
          expect(generate).toHaveBeenCalledTimes(numValuesToPull);
          for (const call of generate.mock.calls) {
            expect(call).toEqual([mrngCloned, biasFactor]);
          }
          expect(values).toEqual(expectedValues);
        }),
      ));

    it('should call generate with cloned instance of Random specific for each Iterator', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const numValuesToPullS1 = 5;
          const numValuesToPullS2 = 3;
          const biasFactor = 48;
          const { instance: sourceArb, generate } = fakeArbitrary();
          generate.mockImplementation(() => new Value(Symbol(), undefined));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(1); // for bias
          const { instance: mrngClonedA } = fakeRandom();
          const { instance: mrngClonedB } = fakeRandom();
          clone.mockReturnValueOnce(mrngClonedA).mockReturnValueOnce(mrngClonedB);

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
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
        }),
      ));

    it('should print pulled values if history is available', async () =>
      await fc.assert(
        fc.asyncProperty(fc.array(fc.integer()), (expectedValues) => {
          // Arrange
          const biasFactor = 48;
          let index = 0;
          const { instance: sourceArb, generate } = fakeArbitrary<number>();
          generate.mockImplementation(() => new Value(expectedValues[index++], undefined));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(2); // for no bias
          const { instance: mrngCloned } = fakeRandom();
          clone.mockReturnValueOnce(mrngCloned);
          const fakeStringify = (v: unknown) => '<' + String(v) + '>';
          const stringify = vi.spyOn(StringifyMock, 'stringify');
          stringify.mockImplementation(fakeStringify);

          // Act
          const arb = new IteratorArbitrary(sourceArb, true);
          const iterator = arb.generate(mrng, biasFactor).value;
          const values = [...iterator.take(expectedValues.length)];

          // Assert
          expect(values).toEqual(expectedValues);
          expect(String(iterator)).toEqual(`Iterator.from([${expectedValues.map(fakeStringify).join(',')}…])`);
          expect(stringify).toHaveBeenCalledTimes(expectedValues.length);
          expect(generate).toHaveBeenCalledTimes(expectedValues.length);
          if (expectedValues.length > 0) {
            expect(generate).toHaveBeenCalledWith(mrngCloned, undefined);
          }
        }),
      ));

    it('should print count of pulled values if there is no history', async () =>
      await fc.assert(
        fc.asyncProperty(fc.array(fc.integer()), (expectedValues) => {
          // Arrange
          const biasFactor = 48;
          let index = 0;
          const { instance: sourceArb, generate } = fakeArbitrary<number>();
          generate.mockImplementation(() => new Value(expectedValues[index++], undefined));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(2); // for no bias
          const { instance: mrngCloned } = fakeRandom();
          clone.mockReturnValueOnce(mrngCloned);
          const fakeStringify = (v: unknown) => '<' + String(v) + '>';
          const stringify = vi.spyOn(StringifyMock, 'stringify');
          stringify.mockImplementation(fakeStringify);

          // Act
          const arb = new IteratorArbitrary(sourceArb, false);
          const iterator = arb.generate(mrng, biasFactor).value;
          void [...iterator.take(expectedValues.length)];

          // Assert
          expect(String(iterator)).toMatch(`(${expectedValues.length} emitted)`);
          expect(generate).toHaveBeenCalledTimes(expectedValues.length);
        }),
      ));

    it('should create independent Iterator', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const biasFactor = 48;
          let index = 0;
          const { instance: sourceArb, generate } = fakeArbitrary<number>();
          generate.mockImplementation(() => new Value(index++, undefined));
          const { instance: mrng, clone, nextInt } = fakeRandom();
          nextInt.mockReturnValueOnce(2); // for no bias
          const { instance: mrngCloned } = fakeRandom();
          clone.mockReturnValueOnce(mrngCloned);
          const stringify = vi.spyOn(StringifyMock, 'stringify');
          stringify.mockImplementation((v) => '<' + String(v) + '>');

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const out = arb.generate(mrng, biasFactor);
          const iterator1 = out.value;
          const iterator2 = out.value;
          const values1 = [...iterator1.take(2)];
          const values2 = [...iterator2.take(3)];

          // Assert
          const expectedFromIterator1 = [0, 1];
          expect(values1).toEqual(expectedFromIterator1);
          const expectedFromIterator2 = [2, 3, 4];
          expect(values2).toEqual([2, 3, 4]);
          const iterator1String = String(iterator1);
          const iterator2String = String(iterator2);
          for (const v of expectedFromIterator1) {
            expect(iterator2String).not.toMatch(`<${v}>`);
            if (history) {
              expect(iterator1String).toMatch(`<${v}>`);
            }
          }
          for (const v of expectedFromIterator2) {
            expect(iterator1String).not.toMatch(`<${v}>`);
            if (history) {
              expect(iterator2String).toMatch(`<${v}>`);
            }
          }
          expect(generate).toHaveBeenCalledTimes(expectedFromIterator1.length + expectedFromIterator2.length);
        }),
      ));
  });

  describe('canShrinkWithoutContext', () => {
    function* infiniteG(): IteratorObject<number> {
      yield 1;
      return undefined;
    }
    it.each`
      data                               | description
      ${nil}                             | ${'empty iterator'}
      ${Iterator.from([1, 5, 6, 74, 4])} | ${'finite iterator'}
      ${infiniteG()}                     | ${'infinite iterator'}
    `('should return false for any Iterator whatever the size ($description)', ({ data }) => {
      // Arrange
      const { instance: sourceArb, canShrinkWithoutContext } = fakeArbitrary();

      // Act
      const arb = new IteratorArbitrary(sourceArb, true);
      const out = arb.canShrinkWithoutContext(data);

      // Assert
      expect(out).toBe(false);
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it('should return false even for its own values', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const { instance: sourceArb, canShrinkWithoutContext } = fakeArbitrary();
          const { instance: mrng } = fakeRandom();

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const g = arb.generate(mrng, undefined);
          const out = arb.canShrinkWithoutContext(g.value);

          // Assert
          expect(out).toBe(false);
          expect(canShrinkWithoutContext).not.toHaveBeenCalled();
        }),
      ));
  });

  describe('shrink', () => {
    it('should always shrink to nil', async () =>
      await fc.assert(
        fc.asyncProperty(fc.boolean(), (history) => {
          // Arrange
          const { instance: sourceArb, generate, shrink } = fakeArbitrary<number>();
          generate.mockReturnValue(new Value(0, undefined));
          const { instance: mrng } = fakeRandom();

          // Act
          const arb = new IteratorArbitrary(sourceArb, history);
          const { value, context } = arb.generate(mrng, undefined);
          const pullValues = [...value.take(50)];
          const shrinks = [...arb.shrink(value, context)];

          // Assert
          expect(pullValues).toBeDefined();
          expect(shrinks).toHaveLength(0);
          expect(shrink).not.toHaveBeenCalled();
        }),
      ));
  });
});

describe('IteratorArbitrary (integration)', () => {
  const sourceArb = new FakeIntegerArbitrary();

  const isEqual = (s1: IteratorObject<number>, s2: IteratorObject<number>) => {
    expect([...cloneIfNeeded(s1).take(10)]).toEqual([...cloneIfNeeded(s2).take(10)]);
  };

  const isCorrect = (value: IteratorObject<number>) =>
    value instanceof Iterator && [...value.take(10)].every((v) => sourceArb.canShrinkWithoutContext(v));

  const iteratorBuilder = () => new IteratorArbitrary(sourceArb, true);

  it('should produce the same values given the same seed', async () => {
    await assertProduceSameValueGivenSameSeed(iteratorBuilder, { isEqual });
  });

  it('should only produce correct values', async () => {
    await assertProduceCorrectValues(iteratorBuilder, isCorrect);
  });
});
