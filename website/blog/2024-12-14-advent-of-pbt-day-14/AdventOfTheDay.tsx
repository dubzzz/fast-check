import adventBuggy from './buggy.mjs';
import adventBuggyRaw from './buggy.mjs?raw';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 14,
  buggyAdvent: adventBuggy,
  snippet: adventBuggyRaw,
  buggyAdventSurcharged: (...args: Parameters<ReturnType<typeof adventBuggy>['compress']>) => {
    const buggy = adventBuggy();
    return buggy.decompress(buggy.compress(...args));
  },
  referenceAdvent: (text) => text,
  parser,
  placeholderForm: 'Any text,\npossibly spanning\non\nmultiple lines...',
  functionName: 'buildCompressor',
  signature: 'function buildCompressor();',
  signatureExtras: [
    'type Compressor = { compress: (text: string) => string; decompress: (compressed: string) => string };',
  ],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  return [answer];
}
