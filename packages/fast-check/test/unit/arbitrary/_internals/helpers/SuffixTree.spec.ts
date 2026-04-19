import { describe, expect, it } from 'vitest';
import { END_TOKEN, START_TOKEN, SuffixTree } from '../../../../../src/arbitrary/_internals/helpers/SuffixTree.js';

type PreviousToken = string | typeof START_TOKEN;
type NextToken = string | typeof END_TOKEN;

describe('SuffixTree', () => {
  it.each<{ corpus: string[]; start: PreviousToken[]; expected: Map<NextToken, number> }>([
    {
      corpus: ['caracas'],
      start: ['c'],
      expected: new Map([
        ['a', 2], // CAracas, caraCAs
      ]),
    },
    {
      corpus: ['caracas'],
      start: ['c', 'a'],
      expected: new Map([
        ['r', 1], // CARacas
        ['s', 1], // caraCAS
      ]),
    },
    {
      corpus: ['caracas'],
      start: ['c', 'a', 'r'],
      expected: new Map([
        ['a', 1], // CARAcas
      ]),
    },
    {
      corpus: ['caracas'],
      start: ['a'],
      expected: new Map([
        ['r', 1], // cARacas
        ['c', 1], // carACas
        ['s', 1], // caracAS
      ]),
    },
    {
      corpus: ['caracas', 'camberra'],
      start: ['a'],
      expected: new Map<NextToken, number>([
        ['r', 1], // cARacas
        ['c', 1], // carACas
        ['s', 1], // caracAS
        ['m', 1], // cAMberra
        [END_TOKEN, 1], // camberrA$
      ]),
    },
    {
      corpus: ['caracas', 'camberra'],
      start: [START_TOKEN],
      expected: new Map<NextToken, number>([
        ['c', 2], // ^Caracas, ^Camberra
      ]),
    },
    {
      corpus: ['caracas', 'camberra'],
      start: ['c'],
      expected: new Map([
        ['a', 3], // CAracas, caraCAs, CAmberra
      ]),
    },
  ])('should properly add $corpus and read $start out of it', ({ corpus, start, expected }) => {
    // Arrange
    const root = new SuffixTree();
    for (const word of corpus) {
      root.add(word);
    }

    // Act
    let tree = root;
    for (let index = start.length - 1; index >= 0; --index) {
      tree = tree.next(start[index])!;
    }
    const values = tree.listPossibleValues();

    // Assert
    const valuesAsMap = new Map(values.map((v) => [v.token, v.count]));
    expect(valuesAsMap).toEqual(expected);
  });
});
