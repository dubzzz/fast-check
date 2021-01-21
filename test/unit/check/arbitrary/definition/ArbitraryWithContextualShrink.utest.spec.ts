import { ArbitraryWithContextualShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithContextualShrink';
import { Stream } from '../../../../../src/stream/Stream';

function buildArbitrary() {
  const generate = jest.fn();
  const contextualShrink = jest.fn();
  const shrunkOnceContext = jest.fn();
  class MyArbitrary extends ArbitraryWithContextualShrink<number> {
    generate = generate;
    contextualShrink = contextualShrink;
    shrunkOnceContext = shrunkOnceContext;
  }
  return { arb: new MyArbitrary(), generate, contextualShrink, shrunkOnceContext };
}

describe('ArbitraryWithShrink', () => {
  describe('contextualShrinkableFor', () => {
    it('Should not call contextualShrink directly when called', () => {
      // Arrange
      const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
      const value = 5;
      const context = Symbol();

      // Act
      const shrinkable = arb.contextualShrinkableFor(value, context);

      // Act
      expect(shrinkable.value).toBe(value);
      expect(generate).not.toHaveBeenCalled();
      expect(contextualShrink).not.toHaveBeenCalled();
      expect(shrunkOnceContext).not.toHaveBeenCalled();
    });

    it('Should call contextualShrink only once on shrink', () => {
      // Arrange
      const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
      const value = 5;
      const context = Symbol();
      const contextualShrinks = [
        [4, Symbol()],
        [8, Symbol()],
        [1, Symbol()],
      ];
      contextualShrink.mockReturnValueOnce(Stream.of(...contextualShrinks));

      // Act
      const shrinkable = arb.contextualShrinkableFor(value, context);

      // Act
      expect([...shrinkable.shrink().map((s) => s.value)]).toEqual(contextualShrinks.map((v) => v[0]));
      expect(contextualShrink).toHaveBeenCalledTimes(1);
      expect(contextualShrink).toHaveBeenCalledWith(value, context);
      expect(generate).not.toHaveBeenCalled();
      expect(shrunkOnceContext).not.toHaveBeenCalled();
    });

    it('Should call contextualShrink with context associated to the shrunk value when shrinking a shrunk value', () => {
      // Remark: It is the responsability of the implementer of this interface to do the same
      //         with the instance of Shrinkable returns by generate.

      // Arrange
      const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
      const value = 5;
      const context = Symbol();
      const contextualShrinks = [
        [4, Symbol()],
        [8, Symbol()],
        [1, Symbol()],
      ];
      const contextualSubShrinks = [
        [14, Symbol()],
        [28, Symbol()],
        [61, Symbol()],
      ];
      contextualShrink
        .mockReturnValueOnce(Stream.of(...contextualShrinks))
        .mockReturnValueOnce(Stream.of(...contextualSubShrinks));

      // Act
      const shrinkable = arb.contextualShrinkableFor(value, context);
      const subShrinkable = shrinkable.shrink().getNthOrLast(1)!;

      // Act
      expect(subShrinkable.value).toBe(contextualShrinks[1][0]);
      expect([...subShrinkable.shrink().map((s) => s.value)]).toEqual(contextualSubShrinks.map((v) => v[0]));
      expect(contextualShrink).toHaveBeenCalledTimes(2);
      expect(contextualShrink).toHaveBeenCalledWith(value, context);
      expect(contextualShrink).toHaveBeenCalledWith(...contextualShrinks[1]);
      expect(generate).not.toHaveBeenCalled();
      expect(shrunkOnceContext).not.toHaveBeenCalled();
    });

    it('Should call contextualShrink again on another shrink', () => {
      // Arrange
      const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
      const value = 5;
      const context = Symbol();
      const contextualShrinks = [
        [4, Symbol()],
        [8, Symbol()],
        [1, Symbol()],
      ];
      contextualShrink.mockReturnValueOnce(Stream.of(...contextualShrinks));
      contextualShrink.mockReturnValueOnce(Stream.of(...contextualShrinks));

      // Act
      const shrinkable = arb.contextualShrinkableFor(value, context);

      // Act
      expect([...shrinkable.shrink().map((s) => s.value)]).toEqual([...shrinkable.shrink().map((s) => s.value)]);
      expect(contextualShrink).toHaveBeenCalledTimes(2);
      expect(contextualShrink).toHaveBeenCalledWith(value, context);
      expect(generate).not.toHaveBeenCalled();
      expect(shrunkOnceContext).not.toHaveBeenCalled();
    });
  });

  describe('shrink [legacy]', () => {
    it.each`
      shrunkOnce   | expectedContext
      ${undefined} | ${undefined}
      ${false}     | ${undefined}
      ${true}      | ${'shrunkOnceContext'}
    `(
      'Should call contextualShrink with context $expectedContext when shrunkOne is $shrunkOnce',
      ({ expectedContext, shrunkOnce }) => {
        // Arrange
        const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
        const value = 5;
        const contextualShrinks = [
          [4, Symbol()],
          [8, Symbol()],
          [1, Symbol()],
        ];
        contextualShrink.mockReturnValueOnce(Stream.of(...contextualShrinks));
        const expectedContextValue = expectedContext !== undefined ? Symbol() : undefined;
        shrunkOnceContext.mockReturnValueOnce(expectedContextValue);

        // Act
        const stream = arb.shrink(value, shrunkOnce);

        // Act
        expect([...stream]).toEqual(contextualShrinks.map((v) => v[0]));
        if (expectedContext !== undefined) expect(shrunkOnceContext).toHaveBeenCalledTimes(1);
        else expect(shrunkOnceContext).not.toHaveBeenCalled();
        expect(contextualShrink).toHaveBeenCalledTimes(1);
        expect(contextualShrink).toHaveBeenCalledWith(value, expectedContextValue);
        expect(generate).not.toHaveBeenCalled();
      }
    );
  });

  describe('shrinkableFor [legacy]', () => {
    it('Should call contextualShrink with a context coming from shrunkOnceContext on sub-shrinks', () => {
      // Arrange
      const { arb, generate, contextualShrink, shrunkOnceContext } = buildArbitrary();
      const value = 5;
      const contextualShrinks = [
        [4, Symbol()],
        [8, Symbol()],
        [1, Symbol()],
      ];
      const contextualSubShrinks = [
        [14, Symbol()],
        [28, Symbol()],
        [61, Symbol()],
      ];
      const contextualSubSubShrinks = [
        [0, Symbol()],
        [7, Symbol()],
      ];
      contextualShrink
        .mockReturnValueOnce(Stream.of(...contextualShrinks))
        .mockReturnValueOnce(Stream.of(...contextualSubShrinks))
        .mockReturnValueOnce(Stream.of(...contextualSubSubShrinks));
      const expectedContextValue = Symbol();
      const expectedContextValue2 = Symbol();
      shrunkOnceContext.mockReturnValueOnce(expectedContextValue).mockReturnValueOnce(expectedContextValue2);

      // Act
      const shrinkable = arb.shrinkableFor(value);
      const stream1 = [...shrinkable.shrink()];
      const subShrinkable = stream1[1];
      const stream2 = [...subShrinkable.shrink()];
      const subSubShrinkable = stream2[2];
      const stream3 = [...subSubShrinkable.shrink()];

      // Act
      expect(shrinkable.value).toBe(value);
      expect([...stream1.map((s) => s.value)]).toEqual(contextualShrinks.map((v) => v[0]));
      expect(subShrinkable.value).toBe(contextualShrinks[1][0]);
      expect([...stream2.map((s) => s.value)]).toEqual(contextualSubShrinks.map((v) => v[0]));
      expect(subSubShrinkable.value).toBe(contextualSubShrinks[2][0]);
      expect([...stream3.map((s) => s.value)]).toEqual(contextualSubSubShrinks.map((v) => v[0]));
      expect(shrunkOnceContext).toHaveBeenCalledTimes(2);
      expect(contextualShrink).toHaveBeenCalledTimes(3);
      expect(contextualShrink).toHaveBeenCalledWith(value, undefined);
      expect(contextualShrink).toHaveBeenCalledWith(contextualShrinks[1][0], expectedContextValue);
      expect(contextualShrink).toHaveBeenCalledWith(contextualSubShrinks[2][0], expectedContextValue2);
      expect(generate).not.toHaveBeenCalled();
    });
  });
});
