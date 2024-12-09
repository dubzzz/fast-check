import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 7,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: simplifyLocation,
  parser,
  placeholderForm: '/123//456/789',
  functionName: 'simplifyLocation',
  signature: 'function simplifyLocation(sourceLocation: string): string;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function simplifyLocation(sourceLocation: string): string {
  const components = sourceLocation.split('/');
  const stack = [];
  for (const component of components) {
    if (component !== '.' && component !== '') {
      if (component === '..') {
        if (stack.length === 0) {
          return sourceLocation;
        }
        stack.pop();
      } else {
        stack.push(component);
      }
    }
  }
  if (stack.length === 0) {
    return sourceLocation;
  }
  return '/' + stack.join('/');
}

// Inputs parser

const validLocationRegex = /^\/\d+(\/\d+|\/|\/\.|\/\.\.)*$/;
function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length !== 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  if (lines[0] !== '✉️' && !validLocationRegex.test(lines[0])) {
    throw new Error(
      'Invalid location provided, we expect the beginning of the path to be /<number> then you can put /., /.. and // wherever you want',
    );
  }
  return [lines[0]];
}
