import { describe, expect, it } from 'vitest';
import {
  computeEntropyEntriesAt,
  positionalStrength,
} from '../../../../../src/arbitrary/_internals/helpers/FuzzerHelpers.js';

const END_SIGNAL = Symbol('end-signal');

describe('positionalStrength', () => {
  it.each`
    delta | expected
    ${-4} | ${1}
    ${-3} | ${1}
    ${-2} | ${1}
    ${-1} | ${4}
    ${0}  | ${9}
    ${1}  | ${4}
    ${2}  | ${1}
    ${3}  | ${1}
    ${4}  | ${1}
    ${10} | ${1}
  `('should return $expected for token at $delta from the requested index', ({ delta, expected }) => {
    // Arrange
    const requestedIndex = 4;
    const pos = requestedIndex + delta;
    const length = 14;

    // Act / Assert
    expect(positionalStrength(requestedIndex, pos, length)).toBe(expected);
  });

  it.each`
    delta | expected
    ${-4} | ${1}
    ${-3} | ${1}
    ${-2} | ${1}
    ${-1} | ${4}
    ${0}  | ${9}
  `(
    'should return $expected for token at $delta from end of string when requested index is out of bound',
    ({ delta, expected }) => {
      // Arrange
      const length = 14;
      const requestedIndex = length + 200;
      const pos = length + delta;

      // Act / Assert
      expect(positionalStrength(requestedIndex, pos, length)).toBe(expected);
    },
  );
});

describe('computeEntropyEntriesAt', () => {
  it('should aggregate positional weights for each token and the end signal from a single-entry corpus', () => {
    // Arrange
    const corpus = [['a', 'b', 'c']];

    // Act
    const hits = [
      computeEntropyEntriesAt(corpus, END_SIGNAL, 0),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 1),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 2),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 3),
    ];

    // Assert
    expect(hits).toEqual([
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 9],
        ['b', 4],
        ['c', 1],
        [END_SIGNAL, 1],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 4],
        ['b', 9],
        ['c', 4],
        [END_SIGNAL, 1],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 1],
        ['b', 4],
        ['c', 9],
        [END_SIGNAL, 4],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 1],
        ['b', 1],
        ['c', 4],
        [END_SIGNAL, 9],
      ]),
    ]);
  });

  it('should aggregate positional weights for each token and the end signal across a multi-entry corpus', () => {
    // Arrange
    const corpus = [
      ['a', 'b', 'c'],
      ['a', 'c'],
    ];

    // Act
    const hits = [
      computeEntropyEntriesAt(corpus, END_SIGNAL, 0),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 1),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 2),
      computeEntropyEntriesAt(corpus, END_SIGNAL, 3),
    ];

    // Assert
    expect(hits).toEqual([
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 9 + 9],
        ['b', 4 + 0],
        ['c', 1 + 4],
        [END_SIGNAL, 1 + 1],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 4 + 4],
        ['b', 9 + 0],
        ['c', 4 + 9],
        [END_SIGNAL, 1 + 4],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 1 + 1],
        ['b', 4 + 0],
        ['c', 9 + 4],
        [END_SIGNAL, 4 + 9],
      ]),
      new Map<string | typeof END_SIGNAL, number>([
        ['a', 1 + 1],
        ['b', 1 + 0],
        ['c', 4 + 4],
        [END_SIGNAL, 9 + 9],
      ]),
    ]);
  });
});
