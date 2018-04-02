declare function require(name: string): any;
const loremIpsum: (opt: any) => string = require('lorem-ipsum');

import Random from '../../random/generator/Random';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

class LoremArbitrary extends Arbitrary<string> {
  readonly arbWordsCount: Arbitrary<number>;
  readonly sentencesMode: boolean;
  constructor(maxWordsCount?: number, sentencesMode?: boolean) {
    super();
    this.arbWordsCount = nat(maxWordsCount || 5);
    this.sentencesMode = sentencesMode || false;
  }
  generate(mrng: Random): Shrinkable<string> {
    const numWords = this.arbWordsCount.generate(mrng).value;
    const loremString = loremIpsum({
      count: numWords,
      units: this.sentencesMode ? 'sentences' : 'words',
      random: () => mrng.nextDouble()
    });
    return new Shrinkable(loremString);
  }
}

function lorem(): Arbitrary<string>;
function lorem(maxWordsCount: number): Arbitrary<string>;
function lorem(maxWordsCount: number, sentencesMode: boolean): Arbitrary<string>;
function lorem(maxWordsCount?: number, sentencesMode?: boolean): Arbitrary<string> {
  return new LoremArbitrary(maxWordsCount, sentencesMode);
}

export { lorem };
