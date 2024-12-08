import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 13,
  buildBuggyAdvent: adventBuggy,
  buggyAdventSurcharged: (...args: Parameters<ReturnType<typeof adventBuggy>>) => {
    try {
      return adventBuggy()(...args);
    } catch (err) {
      return err;
    }
  },
  referenceAdvent: buildSantaURLOfChild,
  parser,
  placeholderForm:
    '"first name, printable characters only, non empty"\n"last name, printable characters only, non empty"\n12345',
  functionName: 'buildSantaURLOfChild',
  signature: 'buildSantaURLOfChild(firstName: string, lastName: string, birthDateTimestamp: number): string;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

/**
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} birthDateTimestamp
 * @returns {string}
 */
function buildSantaURLOfChild(firstName: string, lastName: string, birthDateTimestamp: number): string {
  const table = (i: number): number =>
    Array.from<number>({ length: 8 }).reduce((c: number) => (c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1), i);
  let str = String(birthDateTimestamp);
  for (let i = 0; i !== Math.max(firstName.length, lastName.length); ++i) {
    try {
      str += encodeURIComponent((firstName[i] ?? '') + (lastName[i] ?? ''));
    } catch (err) {}
  }
  let digest = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    digest = (digest >>> 8) ^ table((digest ^ byte) & 0xff);
  }
  digest = (digest ^ -1) >>> 0;
  return `https://my-history.santa-web/${encodeURIComponent(firstName)}-${encodeURIComponent(lastName)}-${digest.toString(16)}`;
}

// Inputs parser

const nameRegex = /^".+"$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length !== 3) {
    throw new Error(`Your answer should be made of three lines`);
  }
  if (!nameRegex.test(lines[0])) {
    throw new Error(`The first name should be of the form: "something made of printable characters and non empty"`);
  }
  if (!nameRegex.test(lines[1])) {
    throw new Error(`The last name should be of the form: "something made of printable characters and non empty"`);
  }
  let firstName = '';
  try {
    firstName = JSON.parse(lines[0]);
    encodeURIComponent(firstName);
  } catch (err) {
    throw new Error(
      `The first name should be of the form: "something made of printable characters and non empty" and use backslash to escape " if any`,
    );
  }
  let lastName = '';
  try {
    lastName = JSON.parse(lines[1]);
    encodeURIComponent(lastName);
  } catch (err) {
    throw new Error(
      `The last name should be of the form: "something made of printable characters and non empty" and use backslash to escape " if any`,
    );
  }
  const birthDateTimestamp = Number(lines[2]);
  if (Number.isNaN(birthDateTimestamp)) {
    throw new Error(`The birth date timestamp must be an integer value being either positive or negeative`);
  }
  return [firstName, lastName, birthDateTimestamp];
}
