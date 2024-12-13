import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 15,
  buildBuggyAdvent: adventBuggy,
  buggyAdventSurcharged: (actions: ('put' | 'pop' | 'isEmpty')[]) => {
    console.log(actions);
    const shelfSize = 5;
    const shelf = adventBuggy()();
    let shelfUsed = 0;
    for (const action of actions) {
      switch (action) {
        case 'put': {
          if (shelfUsed === shelfSize) {
            if (shelf.put() !== -1) {
              return false;
            }
          } else {
            if (shelf.put() === -1) {
              return false;
            }
            ++shelfUsed;
          }
          break;
        }
        case 'pop': {
          if (shelfUsed === 0) {
            if (shelf.pop() !== -1) {
              return false;
            }
          } else {
            if (shelf.pop() === -1) {
              return false;
            }
            --shelfUsed;
          }
          break;
        }
        case 'isEmpty': {
          if (shelf.isEmpty() !== (shelfUsed === 0)) {
            return false;
          }
          break;
        }
      }
    }
    return true;
  },
  referenceAdvent: () => true, // success (aka no-bug) = true
  parser,
  placeholderForm: 'put\nput\npop\nisEmpty\npop\nisEmpty\npush',
  functionName: 'createShelf',
  signature: 'createShelf(): Shelf;',
  signatureExtras: ['type Shelf = { put: () => number; pop: () => number; isEmpty: () => boolean };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  if (answer.trim() === '') {
    return [[]];
  }
  const lines = answer.trim().split('\n');
  for (const line of lines) {
    if (line !== 'put' && line !== 'pop' && line !== 'isEmpty') {
      throw new Error(`Only expecting one of the following operations: put, pop or isEmpty. Received: ${line}`);
    }
  }
  return [lines];
}
