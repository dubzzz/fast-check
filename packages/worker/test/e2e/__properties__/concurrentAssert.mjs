// @ts-check
import { pathToFileURL, fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
import { writeFileSync, existsSync, rmSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const property = propertyFor(pathToFileURL(__filename));

export const concurrentLogFile = path.join(__dirname, `concurrent-log-file`);

let index = 0;
function nextFilenameQuestion() {
  return path.join(__dirname, `concurrent-question-${++index}`);
}
let index2 = 0;
function nextFilenameAnswer() {
  return path.join(__dirname, `concurrent-answer-${++index2}`);
}

/**
 * @param {string} sender
 * @param {string} content
 */
function appendLog(sender, content) {
  writeFileSync(concurrentLogFile, `[${sender}] ${content}\n`, { flag: 'a' });
}

export const readerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    // Send question
    const filenameQuestion = nextFilenameQuestion();
    appendLog('reader', `Send question on ${filenameQuestion}`);
    writeFileSync(filenameQuestion, 'ok');

    // Wait answer
    const filenameAnswer = nextFilenameAnswer();
    appendLog('reader', `Wait answer on ${filenameAnswer}`);
    // eslint-disable-next-line no-empty
    while (!existsSync(filenameAnswer)) {}
    appendLog('reader', `Answer found for ${filenameAnswer}`);
    rmSync(filenameAnswer);
  },
);

export const writerAssert = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    // Wait question
    const filenameQuestion = nextFilenameQuestion();
    appendLog('writer', `Wait question on ${filenameQuestion}`);
    // eslint-disable-next-line no-empty
    while (!existsSync(filenameQuestion)) {}
    appendLog('writer', `Question found for ${filenameQuestion}`);
    rmSync(filenameQuestion);

    // Send answer
    const filenameAnswer = nextFilenameAnswer();
    appendLog('writer', `Write answer on ${filenameAnswer}`);
    writeFileSync(filenameAnswer, 'ok');
  },
);
