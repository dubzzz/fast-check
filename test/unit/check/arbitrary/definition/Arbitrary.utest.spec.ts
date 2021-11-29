import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Stream } from '../../../../../src/stream/Stream';
import * as stubRng from '../../../stubs/generators';
import { cloneMethod, hasCloneMethod } from '../../../../../src/check/symbols';
import { Random } from '../../../../../src/random/generator/Random';

const mrngNoCall = stubRng.mutable.nocall();

describe('NextArbitrary', () => {
  describe('filter', () => {
    it('should filter the values produced by the original arbitrary on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choice1 = new NextValue(1, Symbol());
      const choice2 = new NextValue(2, Symbol());
      const choice3 = new NextValue(3, Symbol());
      const choice4 = new NextValue(4, Symbol());
      generate
        .mockReturnValueOnce(choice1)
        .mockReturnValueOnce(choice2)
        .mockReturnValueOnce(choice3)
        .mockReturnValueOnce(choice4);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().filter((v) => v % 3 === 0);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g).toBe(choice3); // just returning the first NextValue that fits
      expect(generate).toHaveBeenNthCalledWith(3, mrngNoCall, expectedBiasFactor); // same Random not cloned
    });

    it('should filter the values produced by the original arbitrary on shrink', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const valueToShrink = 5;
      const contextToShrink = Symbol();
      const choice1 = new NextValue(1, Symbol());
      const choice2 = new NextValue(2, Symbol());
      const choice3 = new NextValue(3, Symbol());
      const choice4 = new NextValue(4, Symbol());
      const choice5 = new NextValue(6, Symbol());
      shrink.mockReturnValueOnce(Stream.of(choice1, choice2, choice3, choice4, choice5));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().filter((v) => v % 3 === 0);
      const shrinks = arb.shrink(valueToShrink, contextToShrink);

      // Assert
      expect([...shrinks]).toEqual([choice3, choice5]); // just keeping values fitting the predicate
      expect(shrink).toHaveBeenCalledWith(valueToShrink, contextToShrink);
    });

    it.each`
      canShrinkWithoutContextOutput | predicateOutput | expected
      ${false}                      | ${false}        | ${false}
      ${false}                      | ${true}         | ${false}
      ${false}                      | ${false}        | ${false}
      ${true}                       | ${true}         | ${true}
    `(
      'should check underlying arbitrary then predicate to know if the value could have been generated',
      ({ canShrinkWithoutContextOutput, predicateOutput, expected }) => {
        // Arrange
        const requestedValue = Symbol();
        const generate = jest.fn();
        const canShrinkWithoutContext = jest.fn();
        const shrink = jest.fn();
        const predicate = jest.fn();
        class MyNextArbitrary extends Arbitrary<any> {
          generate = generate;
          canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
          shrink = shrink;
        }
        canShrinkWithoutContext.mockReturnValueOnce(canShrinkWithoutContextOutput);
        predicate.mockReturnValueOnce(predicateOutput);

        // Act
        const arb = new MyNextArbitrary().filter(predicate);
        const out = arb.canShrinkWithoutContext(requestedValue);

        // Assert
        expect(out).toBe(expected);
        expect(canShrinkWithoutContext).toHaveBeenCalledWith(requestedValue);
        if (canShrinkWithoutContextOutput) {
          expect(predicate).toHaveBeenCalledWith(requestedValue);
        } else {
          expect(predicate).not.toHaveBeenCalledWith(requestedValue);
          expect(predicate).not.toHaveBeenCalled();
        }
      }
    );
  });

  describe('map', () => {
    it('should map the values produced by the original arbitrary on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choice = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choice);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((v) => String(v));
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g.value).toBe(String(choice.value)); // value has been mapped
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
    });

    it('should preserve cloneable capabilities for mapped values on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choice = new NextValue({ source: 1, [cloneMethod]: () => choice.value_ }, Symbol());
      generate.mockReturnValueOnce(choice);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((v) => ({ stringValue: String(v.source) }));
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g.value.stringValue).toBe(String(choice.value.source)); // value has been mapped
      expect(g.hasToBeCloned).toBe(true); // clone has been preserved on NextValue
      expect(hasCloneMethod(g.value)).toBe(true); // clone has been preserved on the instance
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
    });

    it('should not alter the mapped value if already cloneable on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choice = new NextValue({ source: 1, [cloneMethod]: () => choice.value_ }, Symbol());
      const mappedClone = jest.fn();
      const mapped = { source: 42, [cloneMethod]: mappedClone };
      generate.mockReturnValueOnce(choice);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((_v) => mapped); // mapped already comes with clone capacities
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g.value_).toBe(mapped); // value has been mapped
      expect(g.value_.source).toBe(mapped.source); // value has been mapped and value not altered
      expect(g.value_[cloneMethod]).toBe(mapped[cloneMethod]); // value has been mapped and clone method has been preserved
      expect(g.hasToBeCloned).toBe(true); // clone has been preserved on NextValue
      expect(hasCloneMethod(g.value_)).toBe(true); // clone has been preserved on the instance
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
    });

    it('should properly shrink output of generate by calling back shrink with the right context', () => {
      // Arrange
      const expectedBiasFactor = 42;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const source = new NextValue(69, Symbol());
      generate.mockReturnValueOnce(source);
      const choice1 = new NextValue(1, Symbol());
      const choice2 = new NextValue(2, Symbol());
      const choice3 = new NextValue(3, Symbol());
      shrink.mockReturnValueOnce(Stream.of(choice1, choice2, choice3));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((v) => String(v));
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrinks = arb.shrink(g.value, g.context);

      // Assert
      expect([...shrinks].map((s) => s.value)).toEqual(['1', '2', '3']); // just mapping values
      expect(shrink).toHaveBeenCalledWith(source.value, source.context);
    });

    it('should properly shrink output of shrink by calling back shrink with the right context', () => {
      // Arrange
      const expectedBiasFactor = 42;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const source = new NextValue(69, Symbol());
      generate.mockReturnValueOnce(source);
      const choice1 = new NextValue(1, Symbol());
      const choice2 = new NextValue(2, Symbol());
      const choice3 = new NextValue(3, Symbol());
      shrink.mockReturnValueOnce(Stream.of(choice1, choice2, choice3));
      const choice21 = new NextValue(21, Symbol());
      const choice22 = new NextValue(22, Symbol());
      shrink.mockReturnValueOnce(Stream.of(choice21, choice22));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((v) => String(v));
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrinksGen1 = arb.shrink(g.value, g.context);
      const mappedChoice2 = shrinksGen1.getNthOrLast(1)!;
      const shrinksGen2 = arb.shrink(mappedChoice2.value, mappedChoice2.context);

      // Assert
      expect([...shrinksGen2].map((s) => s.value)).toEqual(['21', '22']); // just mapping values
      expect(shrink).toHaveBeenCalledWith(source.value, source.context);
      expect(shrink).toHaveBeenCalledWith(choice2.value, choice2.context);
    });

    it('should preserve cloneable capabilities for mapped values on shrink', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const source = new NextValue({ source: 1, [cloneMethod]: () => source.value_ }, Symbol());
      generate.mockReturnValueOnce(source);
      const choice1 = new NextValue({ source: 2, [cloneMethod]: () => choice1.value_ }, Symbol());
      const choice2 = new NextValue({ source: 2, [cloneMethod]: () => choice2.value_ }, Symbol());
      shrink.mockReturnValueOnce(Stream.of(choice1, choice2));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((v) => ({ stringValue: String(v.source) }));
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrinks = arb.shrink(g.value, g.context);
      const shrinksValues = [...shrinks];

      // Assert
      expect(shrinksValues).toHaveLength(2);
      expect(shrinksValues[0].hasToBeCloned).toBe(true); // clone has been preserved on NextValue
      expect(shrinksValues[1].hasToBeCloned).toBe(true);
      expect(hasCloneMethod(shrinksValues[0].value)).toBe(true); // clone has been preserved on the instance
      expect(hasCloneMethod(shrinksValues[1].value)).toBe(true);
    });

    it('should always return false for canShrinkWithoutContext when not provided any unmapper function', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map(() => '');
      const out = arb.canShrinkWithoutContext('');

      // Assert
      expect(out).toBe(false);
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it('should return empty stream when shrinking without any context and not provided any unmapper function', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map(() => '');
      const shrinks = arb.shrink('', undefined);

      // Assert
      expect([...shrinks]).toHaveLength(0);
      expect(shrink).not.toHaveBeenCalled();
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it.each`
      outputCanGenerate
      ${false}
      ${true}
    `(
      'should try to unmap the value then call source arbitrary on canShrinkWithoutContext when provided a successful unmapper function',
      ({ outputCanGenerate }) => {
        // Arrange
        const generate = jest.fn();
        const canShrinkWithoutContext = jest.fn().mockReturnValue(outputCanGenerate);
        const shrink = jest.fn();
        const originalValue = Symbol();
        const unmapperOutput = Symbol();
        const unmapper = jest.fn().mockReturnValue(unmapperOutput);
        class MyNextArbitrary extends Arbitrary<any> {
          generate = generate;
          canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
          shrink = shrink;
        }

        // Act
        const arb = new MyNextArbitrary().map(() => Symbol(), unmapper);
        const out = arb.canShrinkWithoutContext(originalValue);

        // Assert
        expect(out).toBe(outputCanGenerate);
        expect(unmapper).toHaveBeenCalledTimes(1);
        expect(unmapper).toHaveBeenCalledWith(originalValue);
        expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
        expect(canShrinkWithoutContext).toHaveBeenCalledWith(unmapperOutput);
      }
    );

    it('should try to unmap the value and stop on error in case of failing unmapper function', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      const originalValue = Symbol();
      const unmapper = jest.fn().mockImplementation(() => {
        throw new Error('Unable to unmap such value');
      });
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map(() => Symbol(), unmapper);
      const out = arb.canShrinkWithoutContext(originalValue);

      // Assert
      expect(out).toBe(false);
      expect(unmapper).toHaveBeenCalledTimes(1);
      expect(unmapper).toHaveBeenCalledWith(originalValue);
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it('should return a mapped version of the stream produced by the source arbitrary for the unmapped value when provided an unmapper function', () => {
      // Arrange
      const expectedStreamValuesFromSource = Stream.of(
        new NextValue('titi', undefined),
        new NextValue('toto', undefined),
        new NextValue('tutu', undefined)
      );
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn().mockReturnValueOnce(expectedStreamValuesFromSource);
      const originalValue = Symbol();
      const unmapperOutput = 'tata';
      const unmapper = jest.fn().mockReturnValue('tata');
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().map((tag) => Symbol.for(tag), unmapper);
      const shrinks = [...arb.shrink(originalValue, undefined)];

      // Assert
      expect(shrinks.map((s) => s.value)).toEqual([Symbol.for('titi'), Symbol.for('toto'), Symbol.for('tutu')]);
      expect(unmapper).toHaveBeenCalledTimes(1);
      expect(unmapper).toHaveBeenCalledWith(originalValue);
      expect(shrink).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledWith(unmapperOutput, undefined);
    });
  });

  describe('chain', () => {
    it('should chain the values produced by the original arbitrary on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choiceRoot = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choiceRoot);
      const generateChained = jest.fn();
      const canShrinkWithoutContextChained = jest.fn() as any as (value: unknown) => value is any;
      const shrinkChained = jest.fn();
      const choiceChained = new NextValue(50, Symbol());
      generateChained.mockReturnValueOnce(choiceChained);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }
      class MyNextChainedArbitrary extends Arbitrary<any> {
        generate = generateChained;
        canShrinkWithoutContext = canShrinkWithoutContextChained;
        shrink = shrinkChained;
      }
      const chainer = jest.fn();
      chainer.mockReturnValueOnce(new MyNextChainedArbitrary());

      // Act
      const arb = new MyNextArbitrary().chain(chainer);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g.value).toBe(choiceChained.value); // value has been chained
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor); // the two calls to generate
      expect(generateChained).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor); // they share the same Random
      expect(chainer).toHaveBeenCalledWith(choiceRoot.value); // chainer was called with output of generate
    });

    it('should properly shrink output of generate by calling back shrink with the right context', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choiceRoot = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choiceRoot);
      const shrinkRoot1 = new NextValue(10, Symbol());
      const shrinkRoot2 = new NextValue(11, Symbol());
      const shrinkRoot3 = new NextValue(15, Symbol());
      shrink.mockReturnValueOnce(Stream.of(shrinkRoot1, shrinkRoot2, shrinkRoot3));
      const generateChained = jest.fn();
      const canShrinkWithoutContextChained = jest.fn() as any as (value: unknown) => value is any;
      const shrinkChained = jest.fn();
      const choiceChained = new NextValue(50, Symbol());
      const choiceShrink1Chained = new NextValue(58, Symbol()); // chain will be called for each sub-shrink of root
      const choiceShrink2Chained = new NextValue(57, Symbol());
      const choiceShrink3Chained = new NextValue(16, Symbol());
      generateChained
        .mockReturnValueOnce(choiceChained)
        .mockReturnValueOnce(choiceShrink1Chained)
        .mockReturnValueOnce(choiceShrink2Chained)
        .mockReturnValueOnce(choiceShrink3Chained);
      const shrinkChained1 = new NextValue(25, Symbol());
      const shrinkChained2 = new NextValue(51, Symbol());
      shrinkChained.mockReturnValueOnce(Stream.of(shrinkChained1, shrinkChained2));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }
      class MyNextChainedArbitrary extends Arbitrary<any> {
        generate = generateChained;
        canShrinkWithoutContext = canShrinkWithoutContextChained;
        shrink = shrinkChained;
      }
      const chainer = jest.fn();
      chainer.mockReturnValue(new MyNextChainedArbitrary());

      // Act
      const arb = new MyNextArbitrary().chain(chainer);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrinks = arb.shrink(g.value, g.context);

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([
        choiceShrink1Chained.value,
        choiceShrink2Chained.value,
        choiceShrink3Chained.value,
        shrinkChained1.value,
        shrinkChained2.value,
      ]); // shrink of source chained, then the one of original chained
      expect(generateChained).toHaveBeenNthCalledWith(4, expect.any(Random), expectedBiasFactor); // sub-sequent calls re-use the original bias
      expect(chainer).toHaveBeenCalledWith(choiceRoot.value); // original call
      expect(chainer).toHaveBeenCalledWith(shrinkRoot1.value); // chained during shrink
      expect(chainer).toHaveBeenCalledWith(shrinkRoot2.value); // chained during shrink
      expect(chainer).toHaveBeenCalledWith(shrinkRoot3.value); // chained during shrink
    });

    it('should properly shrink output of shrink by calling back shrink with the right context', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choiceRoot = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choiceRoot);
      const shrinkRoot1 = new NextValue(10, Symbol());
      const shrinkRoot2 = new NextValue(11, Symbol()); // will not be iterated (getNthOrLast(0))
      const shrinkRoot3 = new NextValue(15, Symbol()); // will not be iterated (getNthOrLast(0))
      shrink.mockReturnValueOnce(Stream.of(shrinkRoot1, shrinkRoot2, shrinkRoot3));
      const shrinkRoot11 = new NextValue(310, Symbol());
      shrink.mockReturnValueOnce(Stream.of(shrinkRoot11));
      const generateChained = jest.fn();
      const canShrinkWithoutContextChained = jest.fn() as any as (value: unknown) => value is any;
      const shrinkChained = jest.fn();
      const choiceChained = new NextValue(50, Symbol());
      const choiceShrink1Chained = new NextValue(58, Symbol()); // chain will be called for each iterated sub-shrink of root (->10)
      const choiceShrink2Chained = new NextValue(57, Symbol()); // ->310 - 11 and 15 will not be retrieved (getNthOrLast(0))
      generateChained
        .mockReturnValueOnce(choiceChained)
        .mockReturnValueOnce(choiceShrink1Chained)
        .mockReturnValueOnce(choiceShrink2Chained);
      const shrinkChained1 = new NextValue(25, Symbol());
      const shrinkChained2 = new NextValue(51, Symbol());
      shrinkChained.mockReturnValueOnce(Stream.of(shrinkChained1, shrinkChained2));
      const shrinkChained11 = new NextValue(125, Symbol());
      const shrinkChained12 = new NextValue(151, Symbol());
      shrinkChained.mockReturnValueOnce(Stream.of(shrinkChained11, shrinkChained12));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }
      class MyNextChainedArbitrary extends Arbitrary<any> {
        generate = generateChained;
        canShrinkWithoutContext = canShrinkWithoutContextChained;
        shrink = shrinkChained;
      }
      const chainer = jest.fn();
      chainer.mockReturnValue(new MyNextChainedArbitrary());

      // Act
      const arb = new MyNextArbitrary().chain(chainer);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const firstShrunkValue = arb.shrink(g.value, g.context).getNthOrLast(0)!;
      const shrinks = arb.shrink(firstShrunkValue.value, firstShrunkValue.context);

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([
        choiceShrink2Chained.value,
        shrinkChained11.value,
        shrinkChained12.value,
      ]);
      expect(generateChained).toHaveBeenNthCalledWith(2, expect.any(Random), expectedBiasFactor); // sub-sequent calls re-use the original bias
      expect(chainer).toHaveBeenCalledWith(choiceRoot.value); // original call
      expect(chainer).toHaveBeenCalledWith(shrinkRoot1.value); // chained during shrink
      expect(chainer).not.toHaveBeenCalledWith(shrinkRoot2.value); // chained during shrink (skipped due to getNthOrLast(0)
      expect(chainer).not.toHaveBeenCalledWith(shrinkRoot3.value); // chained during shrink (skipped due to getNthOrLast(0)
      expect(chainer).toHaveBeenCalledWith(shrinkRoot11.value); // chained during second shrink (returned choiceShrink2Chained)
    });

    it('should stop shrink on source if it exhausted it once', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choiceRoot = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choiceRoot);
      const shrinkRoot1 = new NextValue(10, Symbol());
      const shrinkRoot2 = new NextValue(11, Symbol());
      shrink.mockReturnValueOnce(Stream.of(shrinkRoot1, shrinkRoot2));
      const generateChained = jest.fn();
      const canShrinkWithoutContextChained = jest.fn() as any as (value: unknown) => value is any;
      const shrinkChained = jest.fn();
      const choiceChained = new NextValue(50, Symbol());
      const choiceShrink1Chained = new NextValue(58, Symbol());
      const choiceShrink2Chained = new NextValue(57, Symbol());
      generateChained
        .mockReturnValueOnce(choiceChained)
        .mockReturnValueOnce(choiceShrink1Chained)
        .mockReturnValueOnce(choiceShrink2Chained);
      const shrinkChained1 = new NextValue(25, Symbol());
      const shrinkChained2 = new NextValue(51, Symbol());
      shrinkChained.mockReturnValueOnce(Stream.of(shrinkChained1, shrinkChained2));
      const shrinkChained11 = new NextValue(125, Symbol());
      const shrinkChained12 = new NextValue(151, Symbol());
      shrinkChained.mockReturnValueOnce(Stream.of(shrinkChained11, shrinkChained12));
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }
      class MyNextChainedArbitrary extends Arbitrary<any> {
        generate = generateChained;
        canShrinkWithoutContext = canShrinkWithoutContextChained;
        shrink = shrinkChained;
      }
      const chainer = jest.fn();
      chainer.mockReturnValue(new MyNextChainedArbitrary());

      // Act
      const arb = new MyNextArbitrary().chain(chainer);
      const g = arb.generate(mrngNoCall, expectedBiasFactor);
      const shrunkValue = arb.shrink(g.value, g.context).getNthOrLast(2)!; // source will be exhausted it only declares two shrunk values
      const shrinks = arb.shrink(shrunkValue.value, shrunkValue.context);

      // Assert
      expect([...shrinks].map((v) => v.value)).toEqual([shrinkChained11.value, shrinkChained12.value]);
      expect(shrink).toHaveBeenCalledTimes(1); // not called back on second call to shrink
    });

    it('should always return false for canShrinkWithoutContext when not provided any unchain function', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().chain(() => new MyNextArbitrary());
      const out = arb.canShrinkWithoutContext('');

      // Assert
      expect(out).toBe(false);
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it('should return empty stream when shrinking without any context and not provided any unchainer function', () => {
      // Arrange
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn();
      const shrink = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext as any as (value: unknown) => value is any;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().chain(() => new MyNextArbitrary());
      const shrinks = arb.shrink('', undefined);

      // Assert
      expect([...shrinks]).toHaveLength(0);
      expect(shrink).not.toHaveBeenCalled();
    });
  });

  describe('noShrink', () => {
    it('should simply return the original instance of NextValue on generate', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const generate = jest.fn();
      const canShrinkWithoutContext = jest.fn() as any as (value: unknown) => value is any;
      const shrink = jest.fn();
      const choice = new NextValue(1, Symbol());
      generate.mockReturnValueOnce(choice);
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext = canShrinkWithoutContext;
        shrink = shrink;
      }

      // Act
      const arb = new MyNextArbitrary().noShrink();
      const g = arb.generate(mrngNoCall, expectedBiasFactor);

      // Assert
      expect(g).toBe(choice); // just returning the instance of the source arbitrary (including its context)
      expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
    });

    it('should override default shrink with function returning an empty Stream', () => {
      // Arrange
      const shrink = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canShrinkWithoutContext(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink = shrink;
      }
      const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();
      const noShrinkArbitrary = fakeArbitrary.noShrink();

      // Act
      const out = noShrinkArbitrary.shrink(5, Symbol());

      // Assert
      expect([...out]).toHaveLength(0);
      expect(shrink).not.toHaveBeenCalled();
    });

    it('should return itself when called twice', () => {
      // Arrange
      class MyNextArbitrary extends Arbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canShrinkWithoutContext(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();

      // Act
      const firstNoShrink = fakeArbitrary.noShrink();
      const secondNoShrink = firstNoShrink.noShrink();

      // Assert
      expect(secondNoShrink).toBe(firstNoShrink);
    });
  });

  describe('noBias', () => {
    it('should override passed bias with undefined', () => {
      // Arrange
      const generate = jest.fn();
      class MyNextArbitrary extends Arbitrary<any> {
        generate = generate;
        canShrinkWithoutContext(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();
      const noBiasArbitrary = fakeArbitrary.noBias();

      // Act
      noBiasArbitrary.generate(mrngNoCall, 42);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrngNoCall, undefined);
    });

    it('should return itself when called twice', () => {
      // Arrange
      class MyNextArbitrary extends Arbitrary<any> {
        generate(): NextValue<any> {
          throw new Error('Not implemented.');
        }
        canShrinkWithoutContext(value: unknown): value is any {
          throw new Error('Not implemented.');
        }
        shrink(): Stream<NextValue<any>> {
          throw new Error('Not implemented.');
        }
      }
      const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();

      // Act
      const firstNoBias = fakeArbitrary.noBias();
      const secondNoBias = firstNoBias.noBias();

      // Assert
      expect(secondNoBias).toBe(firstNoBias);
    });
  });
});
