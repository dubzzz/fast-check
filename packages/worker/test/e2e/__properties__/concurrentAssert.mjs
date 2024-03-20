// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const property = propertyFor(new URL(import.meta.url));

let index = 0;
function nextFilenameQuestion() {
  return path.join(__dirname, `concurrent-question-${++index}`);
}
let index2 = 0;
function nextFilenameAnswer() {
  return path.join(__dirname, `concurrent-answer-${++index2}`);
}

exports.readerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    // Send question
    const filenameQuestion = nextFilenameQuestion();
    writeFileSync(filenameQuestion, 'ok');

    // Wait answer
    const filenameAnswer = nextFilenameAnswer();
    while (!existsSync(filenameAnswer)) {}
    rmSync(filenameAnswer);
  },
);

exports.writerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    // Wait question
    const filenameQuestion = nextFilenameQuestion();
    while (!existsSync(filenameQuestion)) {}
    rmSync(filenameQuestion);

    // Send answer
    const filenameAnswer = nextFilenameAnswer();
    writeFileSync(filenameAnswer, 'ok');
  },
);
