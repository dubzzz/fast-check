import * as loremIpsum from 'lorem-ipsum';

import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

let loremGen = loremIpsum;
// @ts-ignore
if (loremIpsum.default) {
  // @ts-ignore
  loremGen = loremIpsum.default;
}

/** @hidden */
class LoremArbitrary extends Arbitrary<string> {
  constructor(readonly numWords: number, readonly mode: 'words' | 'sentences' | 'paragraphs') {
    super();
  }
  generate(mrng: Random): Shrinkable<string> {
    const loremString = loremGen({
      count: this.numWords,
      units: this.mode,
      random: () => mrng.nextDouble()
    });
    return new Shrinkable(loremString);
  }
}

/**
 * For lorem ipsum strings of words
 */
function lorem(): Arbitrary<string>;
/**
 * For lorem ipsum string of words with maximal number of words
 * @param maxWordsCount Upper bound of the number of words allowed
 */
function lorem(maxWordsCount: number): Arbitrary<string>;
/**
 * For lorem ipsum string of words or sentences with maximal number of words or sentences
 * @param maxWordsCount Upper bound of the number of words/sentences allowed
 * @param sentencesMode If enabled, multiple sentences might be generated
 */
function lorem(maxWordsCount: number, sentencesMode: boolean): Arbitrary<string>;
function lorem(maxWordsCount?: number, sentencesMode?: boolean): Arbitrary<string> {
  const mode = sentencesMode ? 'sentences' : 'words';
  return nat(maxWordsCount || 5).chain(numWords => new LoremArbitrary(numWords, mode));
}

export { lorem };
