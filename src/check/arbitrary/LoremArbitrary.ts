declare function require(name:string): any;
var loremIpsum: (opt: any) => string = require('lorem-ipsum')

import Arbitrary from './Arbitrary'
import { nat } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class LoremArbitrary extends Arbitrary<string> {
    readonly arbWordsCount: Arbitrary<number>;
    readonly sentencesMode: boolean;
    constructor(maxWordsCount?: number, sentencesMode?: boolean) {
        super();
        this.arbWordsCount = nat(maxWordsCount || 5);
        this.sentencesMode = sentencesMode || false;
    }
    generate(mrng: MutableRandomGenerator): string {
        const numWords = this.arbWordsCount.generate(mrng);
        return loremIpsum({
            count: numWords,
            units: this.sentencesMode ? 'sentences' : 'words',
            random: () => mrng.next()[0] / (mrng.max() - mrng.min())
        });
    }
}

function lorem(): Arbitrary<string>;
function lorem(maxWordsCount: number): Arbitrary<string>;
function lorem(maxWordsCount: number, sentencesMode: boolean): Arbitrary<string>;
function lorem(maxWordsCount?: number, sentencesMode?: boolean): Arbitrary<string> {
    return new LoremArbitrary(maxWordsCount, sentencesMode);
}

export { lorem };
