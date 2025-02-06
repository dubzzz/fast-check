import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  sentencesToParagraphMapper,
  sentencesToParagraphUnmapper,
  wordsToJoinedStringMapper,
  wordsToJoinedStringUnmapperFor,
  wordsToSentenceMapper,
  wordsToSentenceUnmapperFor,
} from '../../../../../src/arbitrary/_internals/mappers/WordsToLorem';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers';

const wordArbitraryWithoutComma = fc.string({
  unit: fc.nat({ max: 25 }).map((v) => String.fromCodePoint(97 + v)),
  minLength: 1,
});
const wordArbitrary = fc
  .tuple(wordArbitraryWithoutComma, fc.boolean())
  .map(([word, hasComma]) => (hasComma ? `${word},` : word));
const wordsArrayArbitrary = fc.uniqueArray(wordArbitrary, {
  minLength: 1,
  selector: (entry) => (entry.endsWith(',') ? entry.substring(0, entry.length - 1) : entry),
});

describe('wordsToJoinedStringMapper', () => {
  it.each`
    words                                 | expectedOutput           | behaviour
    ${['il', 'était', 'une', 'fois']}     | ${'il était une fois'}   | ${'join using space'}
    ${['demain,', 'il', 'fera', 'beau']}  | ${'demain il fera beau'} | ${'trim trailing commas on each word'}
    ${['demain', 'il,', 'fera', 'beau,']} | ${'demain il fera beau'} | ${'trim trailing commas on each word'}
  `('should map $words into $expectedOutput ($behaviour)', ({ words, expectedOutput }) => {
    // Arrange / Act
    const out = wordsToJoinedStringMapper(words);

    // Assert
    expect(out).toBe(expectedOutput);
  });
});

describe('wordsToJoinedStringUnmapperFor', () => {
  it('should unmap string made of words strictly coming from the source', () => {
    // Arrange
    const { instance: wordsArbitrary, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world', 'winter', 'summer'].includes(value),
    );

    // Act
    const unmapper = wordsToJoinedStringUnmapperFor(wordsArbitrary);
    const unmappedValue = unmapper('hello hello winter world');

    // Assert
    expect(unmappedValue).toEqual(['hello', 'hello', 'winter', 'world']);
  });

  it('should unmap string made of words with some having trimmed commas', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello,', 'world,', 'winter', 'summer'].includes(value),
    );

    // Act
    const unmapper = wordsToJoinedStringUnmapperFor(instance);
    const unmappedValue = unmapper('hello hello winter world');

    // Assert
    expect(unmappedValue).toEqual(['hello,', 'hello,', 'winter', 'world,']);
  });

  it('should reject strings containing unknown words', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello,', 'world,', 'spring', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToJoinedStringUnmapperFor(instance);
    expect(() => unmapper('hello hello winter world')).toThrowError();
  });

  it('should unmap any string coming from the mapper', () =>
    fc.assert(
      fc.property(wordsArrayArbitrary, (words) => {
        // Arrange
        const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
        canShrinkWithoutContext.mockImplementation(
          (value): value is string => typeof value === 'string' && words.includes(value),
        );

        // Act
        const mapped = wordsToJoinedStringMapper(words);
        const unmapper = wordsToJoinedStringUnmapperFor(instance);
        const unmappedValue = unmapper(mapped);

        // Assert
        expect(unmappedValue).toEqual(words);
      }),
    ));
});

describe('wordsToSentenceMapper', () => {
  it.each`
    words                                 | expectedOutput             | behaviour
    ${['il', 'était', 'une', 'fois']}     | ${'Il était une fois.'}    | ${'join using space'}
    ${['demain,', 'il', 'fera', 'beau']}  | ${'Demain, il fera beau.'} | ${'trim trailing commas only on last word'}
    ${['demain', 'il,', 'fera', 'beau,']} | ${'Demain il, fera beau.'} | ${'trim trailing commas only on last word'}
    ${['demain']}                         | ${'Demain.'}               | ${'one word sentence'}
    ${['demain,']}                        | ${'Demain.'}               | ${'one word comma-ending sentence'}
  `('should map $words into $expectedOutput ($behaviour)', ({ words, expectedOutput }) => {
    // Arrange / Act
    const out = wordsToSentenceMapper(words);

    // Assert
    expect(out).toBe(expectedOutput);
  });
});

describe('wordsToSentenceUnmapperFor', () => {
  it('should unmap string made of words strictly coming from the source', () => {
    // Arrange
    const { instance: wordsArbitrary, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world', 'winter', 'summer'].includes(value),
    );

    // Act
    const unmapper = wordsToSentenceUnmapperFor(wordsArbitrary);
    const unmappedValue = unmapper('Hello hello winter world.');

    // Assert
    expect(unmappedValue).toEqual(['hello', 'hello', 'winter', 'world']);
  });

  it('should unmap string made of words with last one having trimmed comma', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello,', 'world,', 'winter', 'summer'].includes(value),
    );

    // Act
    const unmapper = wordsToSentenceUnmapperFor(instance);
    const unmappedValue = unmapper('Hello, hello, winter world.');

    // Assert
    expect(unmappedValue).toEqual(['hello,', 'hello,', 'winter', 'world,']);
  });

  it('should reject strings containing unknown words', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world,', 'spring', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToSentenceUnmapperFor(instance);
    expect(() => unmapper('Hello hello spring world.')).not.toThrowError();
    expect(() => unmapper('Hello hello winter world.')).toThrowError();
  });

  it('should reject strings not starting by a capital leter', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world,', 'winter', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToSentenceUnmapperFor(instance);
    expect(() => unmapper('Hello hello winter world.')).not.toThrowError();
    expect(() => unmapper('hello hello winter world.')).toThrowError();
  });

  it('should reject strings not ending by a point', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world,', 'winter', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToSentenceUnmapperFor(instance);
    expect(() => unmapper('Hello hello winter world.')).not.toThrowError();
    expect(() => unmapper('Hello hello winter world')).toThrowError();
  });

  it('should reject strings with last word ending by a comma followed by point', () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world,', 'winter', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToSentenceUnmapperFor(instance);
    expect(() => unmapper('Hello hello winter world.')).not.toThrowError();
    expect(() => unmapper('Hello hello winter world,.')).toThrowError();
  });

  it("should reject strings if one of first words do not includes it's expected comma", () => {
    // Arrange
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation(
      (value): value is string => typeof value === 'string' && ['hello', 'world,', 'winter,', 'summer'].includes(value),
    );

    // Act / Assert
    const unmapper = wordsToSentenceUnmapperFor(instance);
    expect(() => unmapper('Hello hello winter, world.')).not.toThrowError();
    expect(() => unmapper('Hello hello winter world.')).toThrowError();
  });

  it('should unmap any string coming from the mapper', () =>
    fc.assert(
      fc.property(wordsArrayArbitrary, (words) => {
        // Arrange
        const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
        canShrinkWithoutContext.mockImplementation(
          (value): value is string => typeof value === 'string' && words.includes(value),
        );

        // Act
        const mapped = wordsToSentenceMapper(words);
        const unmapper = wordsToSentenceUnmapperFor(instance);
        const unmappedValue = unmapper(mapped);

        // Assert
        expect(unmappedValue).toEqual(words);
      }),
    ));
});

describe('wordsToSentenceUnmapperFor', () => {
  it('should unmap any string coming from the mapper', () =>
    fc.assert(
      fc.property(
        fc.array(
          wordsArrayArbitrary.map((words) => wordsToSentenceMapper(words)),
          { minLength: 1 },
        ),
        (sentences) => {
          // Arrange / Act
          const mapped = sentencesToParagraphMapper(sentences);
          const unmappedValue = sentencesToParagraphUnmapper(mapped);

          // Assert
          expect(unmappedValue).toEqual(sentences);
        },
      ),
    ));
});
