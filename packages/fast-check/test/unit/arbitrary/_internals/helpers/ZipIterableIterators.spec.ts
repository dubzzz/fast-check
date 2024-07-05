import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { zipIterableIterators } from '../../../../../src/arbitrary/_internals/helpers/ZipIterableIterators';

describe('zipIterableIterators', () => {
  it('should zip two iterators having the same size together', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.anything(), fc.anything())), (entries) => {
        // Arrange
        const entriesFirst = entries.map((es) => es[0]);
        const entriesSecond = entries.map((es) => es[1]);

        // Act
        const zipped = zipIterableIterators(entriesFirst[Symbol.iterator](), entriesSecond[Symbol.iterator]());

        // Assert
        expect([...zipped]).toStrictEqual(entries);
      }),
    );
  });

  it('should zip two iterators with first maybe longer together by ignoring extra values of the first one', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.anything(), fc.anything())),
        fc.array(fc.anything()),
        (entries, extraValueFirst) => {
          // Arrange
          const entriesFirst = [...entries.map((es) => es[0]), ...extraValueFirst];
          const entriesSecond = entries.map((es) => es[1]);

          // Act
          const zipped = zipIterableIterators(entriesFirst[Symbol.iterator](), entriesSecond[Symbol.iterator]());

          // Assert
          expect([...zipped]).toStrictEqual(entries);
        },
      ),
    );
  });

  it('should zip two iterators with second maybe longer together by ignoring extra values of the second one', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.anything(), fc.anything())),
        fc.array(fc.anything()),
        (entries, extraValueSecond) => {
          // Arrange
          const entriesFirst = entries.map((es) => es[0]);
          const entriesSecond = [...entries.map((es) => es[1]), ...extraValueSecond];

          // Act
          const zipped = zipIterableIterators(entriesFirst[Symbol.iterator](), entriesSecond[Symbol.iterator]());

          // Assert
          expect([...zipped]).toStrictEqual(entries);
        },
      ),
    );
  });

  it('should only pull the value when asked', () => {
    // Arrange
    let pulledTimes = 0;
    function* gen() {
      while (true) {
        yield ++pulledTimes;
      }
    }

    // Act / Assert
    // No pull at creation time
    const zipped = zipIterableIterators(gen());
    expect(pulledTimes).toBe(0);
    // Pulling once for first next
    let it = zipped.next();
    expect(pulledTimes).toBe(1);
    expect(it.value).toEqual([pulledTimes]);
    // Pulling once more for second next
    it = zipped.next();
    expect(pulledTimes).toBe(2);
    expect(it.value).toEqual([pulledTimes]);
    // Pulling once more for third next
    it = zipped.next();
    expect(pulledTimes).toBe(3);
    expect(it.value).toEqual([pulledTimes]);
  });
});
