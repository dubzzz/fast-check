import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from './AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 1,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: sortLetters,
  parser,
  placeholderForm: 'Anne=15\nPaul=38\nElena=81',
  functionName: 'sortLetters',
  signature: 'function sortLetters(letters: Letter[]): Letter[];',
  signatureExtras: ['type Letter = { name: string; age: number };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

type Letter = { name: string; age: number };

function sortLetters(letters: Letter[]): Letter[] {
  const clonedLetters = [...letters];
  return clonedLetters.sort((la, lb) =>
    la.age !== lb.age ? la.age - lb.age : la.name > lb.name ? 1 : la.name < lb.name ? -1 : 0,
  );
}

// Inputs parser

const lineRegex = /^([a-z]+)=(\d+)$/;
function parser(answer: string): unknown[] | undefined {
  const parsedAnswer: Letter[] = [];
  for (const line of answer.trim().split('\n')) {
    const m = lineRegex.exec(line);
    if (m === null) {
      throw new Error(
        'Each line of the answer should follow the pattern: name=age, with name only made of characters in a-z and of length minimum one and age being exclusively between 7 and 77',
      );
    }
    parsedAnswer.push({ name: m[1], age: Number(m[2]) });
  }
  return [parsedAnswer];
}
