import * as fs from 'fs';
import fc from '../../../src/fast-check';

// For ES Modules:
//import { dirname } from 'path';
//import { fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

const TargetNumExamples = 5;
const JsBlockStart = '```js';
const JsBlockEnd = '```';
const CommentForGeneratedValues = '// Examples of generated values:';

describe('Docs.md', () => {
  it('Should check code snippets validity and fix generated values', () => {
    const originalFileContent = fs.readFileSync(`${__dirname}/../../../documentation/Arbitraries.md`).toString();
    const { content: fileContent } = refreshContent(originalFileContent);

    if (fileContent !== originalFileContent && process.env.UPDATE_CODE_SNIPPETS) {
      console.warn(`Updating code snippets defined in the documentation...`);
      fs.writeFileSync(`${__dirname}/../../../documentation/Arbitraries.md`, fileContent);
    }
    expect(fileContent).toEqual(originalFileContent);
  });
});

// Helpers

function extractJsCodeBlocks(content: string): string[] {
  const lines = content.split('\n');
  const blocks: string[] = [];

  let isJsBlock = false;
  let currentBlock: string[] = [];
  for (const line of lines) {
    if (isJsBlock) {
      currentBlock.push(line);
      if (line === JsBlockEnd) {
        blocks.push(currentBlock.join('\n') + '\n');
        isJsBlock = false;
        currentBlock = [];
      }
    } else if (line === JsBlockStart) {
      blocks.push(currentBlock.join('\n') + '\n');
      isJsBlock = true;
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length !== 0) {
    blocks.push(currentBlock.join('\n'));
  }
  return blocks;
}

function isJsCodeBlock(blockContent: string): boolean {
  return blockContent.startsWith(`${JsBlockStart}\n`) && blockContent.endsWith(`${JsBlockEnd}\n`);
}

function trimJsCodeBlock(blockContent: string): string {
  const startLength = `${JsBlockStart}\n`.length;
  const endLength = `${JsBlockEnd}\n`.length;
  return blockContent.substr(startLength, blockContent.length - startLength - endLength);
}

function addJsCodeBlock(blockContent: string): string {
  return `${JsBlockStart}\n${blockContent}${JsBlockEnd}\n`;
}

function refreshContent(originalContent: string): { content: string; numExecutedSnippets: number } {
  // Re-run all the code (supported) snippets
  // Re-generate all the examples

  let numExecutedSnippets = 0;

  // Extract code blocks
  const extractedBlocks = extractJsCodeBlocks(originalContent);

  // Execute code blocks
  const refinedBlocks = extractedBlocks.map((block) => {
    if (!isJsCodeBlock(block)) return block;

    // Remove list of examples
    const cleanedBlock = trimJsCodeBlock(block).replace(
      new RegExp(`${CommentForGeneratedValues}[^\n]*(\n//.*)*`, 'mg'),
      CommentForGeneratedValues
    );

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
        const evalCode = `fc.sample(${snippet}\n, { numRuns: ${
          2 * TargetNumExamples
        }, seed: 42 }).map(v => fc.stringify(v))`;
        try {
          return eval(evalCode);
        } catch (err) {
          throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`);
        }
      })(fc);

      const uniqueGeneratedValues = Array.from(new Set(generatedValues)).slice(0, TargetNumExamples);
      return `${snippet} ${uniqueGeneratedValues.join(', ')}…`;
    });

    return addJsCodeBlock(updatedSnippets.join(''));
  });

  return { content: refinedBlocks.join(''), numExecutedSnippets };
}
