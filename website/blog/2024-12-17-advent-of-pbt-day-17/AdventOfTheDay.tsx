import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 17,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: isValidEmail,
  parser,
  placeholderForm: 'something@domain.stuff',
  functionName: 'isValidEmail',
  signature: 'isValidEmail(emailAddress: string): boolean;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isValidEmail(emailAddress: string): boolean {
  const rfc1123 =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const rfc5322 =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return (
    rfc1123.test(emailAddress) && // rfc1123
    emailAddress.split('@')[0].length <= 64 && // rfc2821
    emailAddress.split('@')[1].length <= 255 && // rfc2821
    rfc5322.test(emailAddress)
  );
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length !== 1) {
    throw new Error(`Your answer should be made of exactly one line`);
  }
  return [lines[0]];
}
