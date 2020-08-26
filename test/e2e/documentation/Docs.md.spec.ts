import * as fs from 'fs';
import fc from '../../../src/fast-check';

// For ES Modules:
//import { dirname } from 'path';
//import { fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

const JsBlockStart = '```js';
const JsBlockEnd = '```';
const CommentForGeneratedValues = 'Examples of generated values:';

describe('Docs.md', () => {
  it('Should check code snippets validity and fix generated values', () => {
    const originalFileContent = fs.readFileSync(`${__dirname}/../../../documentation/Arbitraries.md`).toString();
    const { content: fileContent } = refreshContent(originalFileContent);

    if (fileContent !== originalFileContent) {
      fs.writeFileSync(`${__dirname}/../../../documentation/Arbitraries.md`, fileContent);
    }
    expect(fileContent).toEqual(originalFileContent);
  });
});

// Helpers

function flatMap<T, U>(original: T[], mapper: (value: T, index: number) => U[]): U[] {
  const newItems: U[] = [];
  for (let index = 0; index !== original.length; ++index) {
    newItems.concat(...mapper(original[index], index));
  }
  return newItems;
}

function splitForBlocks(content: string, blockStart: string, blockEnd: string): string[] {
  return flatMap(content.split(`${blockStart}\n`), (blockS, indexS) => {
    const blockWithStart = indexS === 0 ? blockS : `${blockStart}\n${blockS}`;
    return blockWithStart
      .split(`\n${blockEnd}`, 2)
      .map((blockE, indexE) => (indexE === 0 ? `${blockE}\n${blockEnd}` : blockE));
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
    const cleanedBlock = block.replace(
      new RegExp(`\/\/ ${CommentForGeneratedValues}[^\n]*(\n//.*)*`, 'mg'),
      `${CommentForGeneratedValues}`
    );

    // Extract code snippets
    const snippets = splitForBlocks(cleanedBlock, '', CommentForGeneratedValues);

    // Execute blocks and set examples
    const updatedSnippets = snippets.map((snippet) => {
      if (!isBlock(snippet, '', CommentForGeneratedValues)) return snippet;

      ++numExecutedSnippets;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const generatedValues = (function (fc) {
        return eval(`fc.sample(${snippet}\n, { numRuns: 5, seed: 42 }).map(v => fc.stringify(v))`);
      })(fc);

      return `${snippet} ${generatedValues.join(', ')}`;
    });

    return updatedSnippets.join('');
  });

  return { content: refinedBlocks.join(''), numExecutedSnippets };
}
