import * as fs from 'fs';
import fc from '../../../src/fast-check';

// For ES Modules:
//import { dirname } from 'path';
//import { fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

const JsBlockStart = '```js';
const JsBlockEnd = '```';
const CommentForGeneratedValues = '// Examples of generated values:';

describe('Docs.md', () => {
  it('Should check code snippets validity and fix generated values', () => {
    const originalFileContent = fs.readFileSync(`${__dirname}/../../../documentation/Arbitraries.md`).toString();
    const { content: fileContent } = refreshContent(originalFileContent);

    //UNCOMMENT to re-generate the documentation
    //if (fileContent !== originalFileContent) {
    //  fs.writeFileSync(`${__dirname}/../../../documentation/Arbitraries.md`, fileContent);
    //}
    expect(fileContent).not.toEqual(originalFileContent);
  });
});

// Helpers

function flatMap<T, U>(original: T[], mapper: (value: T, index: number) => U[]): U[] {
  const newItems: U[] = [];
  for (let index = 0; index !== original.length; ++index) {
    newItems.push(...mapper(original[index], index));
  }
  return newItems;
}

function splitForBlocks(content: string, blockStart: string, blockEnd: string): string[] {
  return flatMap(content.split(`${blockStart}\n`), (blockS, indexS) => {
    if (indexS === 0) {
      return [blockS];
    }
    const splits = `${blockStart}\n${blockS}`.split(`\n${blockEnd}`, 2);
    if (splits.length !== 2) {
      return splits;
    }
    return splits.map((blockE, indexE) => (indexE === 0 ? `${blockE}\n${blockEnd}` : blockE));
  });
}

function isBlock(content: string, blockStart: string, blockEnd: string): boolean {
  return content.startsWith(`${blockStart}\n`) && content.endsWith(`\n${blockEnd}`);
}

function refreshContent(originalContent: string): { content: string; numExecutedSnippets: number } {
  // Re-run all the code (supported) snippets
  // Re-generate all the examples

  let numExecutedSnippets = 0;

  // Extract code blocks
  const extractedBlocks = splitForBlocks(originalContent, JsBlockStart, JsBlockEnd);

  // Execute code blocks
  const refinedBlocks = extractedBlocks.map((block) => {
    if (!isBlock(block, JsBlockStart, JsBlockEnd)) return block;

    // Remove list of examples
    const cleanedBlock = block
      .substr(JsBlockStart.length, block.length - JsBlockStart.length - JsBlockEnd.length)
      .replace(new RegExp(`${CommentForGeneratedValues}[^\n]*(\n//.*)*`, 'mg'), CommentForGeneratedValues);

    // Extract code snippets
    const snippets = cleanedBlock
      .split(`\n${CommentForGeneratedValues}`)
      .map((snippet, index, all) => (index !== all.length - 1 ? `${snippet}\n${CommentForGeneratedValues}` : snippet));

    // Execute blocks and set examples
    const updatedSnippets = snippets.map((snippet) => {
      if (!snippet.endsWith(CommentForGeneratedValues)) return snippet;

      ++numExecutedSnippets;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const generatedValues = (function (fc) {
        const evalCode = `fc.sample(${snippet}\n, { numRuns: 5, seed: 42 }).map(v => fc.stringify(v))`;
        try {
          return eval(evalCode);
        } catch (err) {
          throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`);
        }
      })(fc);

      return `${snippet} ${generatedValues.join(', ')}`;
    });

    return `${JsBlockStart}${updatedSnippets.join('')}${JsBlockEnd}`;
  });

  return { content: refinedBlocks.join(''), numExecutedSnippets };
}
