// @ts-check
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
import { writeFileSync, existsSync, rmSync } from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const property = propertyFor(pathToFileURL(__filename));

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
