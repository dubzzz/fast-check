// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
const { writeFileSync, existsSync, rmSync } = require('fs');
const path = require('path');

const property = propertyFor(new URL(import.meta.url));

let index = 0;
function nextFilenameQuestion() {
  return path.join(__dirname, `concurrent-question-${++index}`);
}
let index2 = 0;
function nextFilenameAnswer() {
  return path.join(__dirname, `concurrent-answer-${++index2}`);
}

export const readerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    // Send question
    const filenameQuestion = nextFilenameQuestion();
    writeFileSync(filenameQuestion, 'ok');

    // Wait answer
    const filenameAnswer = nextFilenameAnswer();
    // eslint-disable-next-line no-empty
    while (!existsSync(filenameAnswer)) {}
    rmSync(filenameAnswer);
  },
);

export const writerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    // Wait question
    const filenameQuestion = nextFilenameQuestion();
    // eslint-disable-next-line no-empty
    while (!existsSync(filenameQuestion)) {}
    rmSync(filenameQuestion);

    // Send answer
    const filenameAnswer = nextFilenameAnswer();
    writeFileSync(filenameAnswer, 'ok');
  },
);
