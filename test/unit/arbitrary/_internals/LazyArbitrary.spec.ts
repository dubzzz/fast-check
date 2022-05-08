import { LazyArbitrary } from '../../../../src/arbitrary/_internals/LazyArbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../../src/stream/Stream';
import { fakeNextArbitrary } from '../__test-helpers__/NextArbitraryHelpers';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';

describe('LazyArbitrary', () => {
  describe('generate', () => {
    it('should call underlying on generate', () => {
      // Arrange
      const value = new Value(Symbol(), Symbol());
      const { instance: mrng } = fakeRandom();
      const { instance: underlying, generate } = fakeNextArbitrary();
      generate.mockReturnValue(value);
      const lazy = new LazyArbitrary('id007');
      lazy.underlying = underlying;

      // Act
      const out = lazy.generate(mrng, 2);

      // Assert
      expect(out).toBe(value);
      expect(generate).toHaveBeenCalledWith(mrng, 2);
    });

    it('should fail to generate when no underlying arbitrary', () => {
      // Arrange / Act
      const { instance: mrng } = fakeRandom();
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.generate(mrng, 2)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });
  });

  describe('canShrinkWithoutContext', () => {
    it.each`
      returnValue
      ${false}
      ${true}
    `('should call underlying on canShrinkWithoutContext ($returnValue)', ({ returnValue }) => {
      // Arrange
      const value = Symbol();
      const { instance: underlying, canShrinkWithoutContext } = fakeNextArbitrary();
      canShrinkWithoutContext.mockReturnValue(returnValue);
      const lazy = new LazyArbitrary('id007');
      lazy.underlying = underlying;

      // Act
      const out = lazy.canShrinkWithoutContext(value);

      // Assert
      expect(out).toBe(returnValue);
      expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    });

    it('should fail to check canShrinkWithoutContext when no underlying arbitrary', () => {
      // Arrange / Act
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.canShrinkWithoutContext(1)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });
  });

  describe('shrink', () => {
    it('should call underlying on shrink', () => {
      // Arrange
      const value = Symbol();
      const context = Symbol();
      const streamOutput = Stream.of(new Value(1, undefined));
      const { instance: underlying, shrink } = fakeNextArbitrary();
      shrink.mockReturnValue(streamOutput);
      const lazy = new LazyArbitrary('id007');
      lazy.underlying = underlying;

      // Act
      const out = lazy.shrink(value, context);

      // Assert
      expect(out).toBe(streamOutput);
      expect(shrink).toHaveBeenCalledWith(value, context);
    });

    it('should fail to shrink when no underlying arbitrary', () => {
      // Arrange / Act
      const lazy = new LazyArbitrary('id007');

      // Assert
      expect(() => lazy.shrink(1, 2)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"id007\\" not correctly initialized"`
      );
    });
  });
});
