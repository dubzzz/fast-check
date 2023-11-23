// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* global __filename, exports, require, __dirname */
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');
const { writeFileSync, existsSync, rmSync } = require('fs');
const path = require('path');

const property = propertyFor(pathToFileURL(__filename));

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
