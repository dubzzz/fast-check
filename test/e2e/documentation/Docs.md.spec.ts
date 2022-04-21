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
const CommentForArbitraryIndicator = '// Use the arbitrary:';
const CommentForStatistics = '// Computed statistics for 10k generated values:';

describe('Docs.md', () => {
  it('Should check code snippets validity and fix generated values', () => {
    const originalFileContent = fs.readFileSync(`${__dirname}/../../../documentation/Arbitraries.md`).toString();
    const { content: fileContent } = refreshContent(originalFileContent);

    if (Number(process.versions.node.split('.')[0]) < 12) {
      // There were some updates regarding how to stringify invalid surrogate pairs
      // between node 10 and node 12 with JSON.stringify.
      // It directly impacts fc.stringify.
      //
      // In node 10: JSON.stringify("\udff5") === '"\udff5"'
      // In node 12: JSON.stringify("\udff5") === '"\\udff5"'
      // You may try with: JSON.stringify("\udff5").split('').map(c => c.charCodeAt(0).toString(16))

      console.warn(`Unable to properly check code snippets defined in the documentation...`);

      const sanitize = (s: string) => s.replace(/(\\)(u[0-9a-f]{4})/g, (c) => JSON.parse('"' + c + '"'));
      expect(sanitize(fileContent)).toEqual(sanitize(originalFileContent));

      if (process.env.UPDATE_CODE_SNIPPETS) {
        throw new Error('You must use a more recent release of node to update code snippets (>=12)');
      }
      return;
    }

    if (fileContent !== originalFileContent && process.env.UPDATE_CODE_SNIPPETS) {
      console.warn(`Updating code snippets defined in the documentation...`);
      fs.writeFileSync(`${__dirname}/../../../documentation/Arbitraries.md`, fileContent);
    }
    if (!process.env.UPDATE_CODE_SNIPPETS) {
      expect(fileContent).toEqual(originalFileContent);
    }
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

    // Remove list of examples and statistics
    const cleanedBlock = trimJsCodeBlock(block)
      .replace(new RegExp(`${CommentForGeneratedValues}[^\n]*(\n//.*)*`, 'mg'), CommentForGeneratedValues)
      .replace(new RegExp(`${CommentForStatistics}[^\n]*(\n//.*)*`, 'mg'), CommentForStatistics);

    // Extract code snippets
    const snippets = cleanedBlock
      .split(`\n${CommentForGeneratedValues}`)
      .map((snippet, index, all) => (index !== all.length - 1 ? `${snippet}\n${CommentForGeneratedValues}` : snippet));

    // Execute blocks and set examples
    const updatedSnippets = snippets.map((snippet) => {
      if (!snippet.endsWith(CommentForGeneratedValues)) return snippet;

      ++numExecutedSnippets;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const generatedValues = (function (fc): string[] {
        const numRuns = 5 * TargetNumExamples;
        const seed = snippet.replace(/\s*\/\/.*/g, '').replace(/\s+/gm, ' ').length;
        const indexArbitraryPart = snippet.indexOf(CommentForArbitraryIndicator);

        const preparationPart = indexArbitraryPart !== -1 ? snippet.substring(0, indexArbitraryPart) : '';
        const arbitraryPart = indexArbitraryPart !== -1 ? snippet.substring(indexArbitraryPart) : snippet;
        const evalCode = `${preparationPart}\nfc.sample(${arbitraryPart}\n, { numRuns: ${numRuns}, seed: ${seed} }).map(v => fc.stringify(v))`;
        try {
          return eval(evalCode);
        } catch (err) {
          throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`);
        }
      })(fc);

      const uniqueGeneratedValues = Array.from(new Set(generatedValues)).slice(0, TargetNumExamples);
      // If the display for generated values is too long, we split it into a list of items
      if (
        uniqueGeneratedValues.some((value) => value.includes('\n')) ||
        uniqueGeneratedValues.reduce((totalLength, value) => totalLength + value.length, 0) > 120
      ) {
        return `${snippet}${[...uniqueGeneratedValues, '…']
          .map((v) => `\n// • ${v.replace(/\n/gm, '\n//   ')}`)
          .join('')}`;
      } else {
        return `${snippet} ${uniqueGeneratedValues.join(', ')}…`;
      }
    });

    // Extract statistics snippets
    const statisticsSnippets = updatedSnippets
      .join('')
      .split(`\n${CommentForStatistics}`)
      .map((snippet, index, all) => (index !== all.length - 1 ? `${snippet}\n${CommentForStatistics}` : snippet));

    // Execute statistics
    const updatedStatisticsSnippets = statisticsSnippets.map((snippet) => {
      if (!snippet.endsWith(CommentForStatistics)) return snippet;

      ++numExecutedSnippets;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const computedStatitics = (function (fc): string[] {
        const lines: string[] = [];
        const sourceConsoleLog = console.log;
        console.log = (line) => lines.push(line);
        const seed = snippet.replace(/\s*\/\/.*/g, '').replace(/\s+/gm, ' ').length;
        const evalCode = `fc.configureGlobal({seed: ${seed}, numRuns: 10000});${snippet}`;
        try {
          eval(snippet);
          return lines;
        } catch (err) {
          throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`);
        } finally {
          console.log = sourceConsoleLog;
        }
      })(fc);
      return `${snippet}\n${computedStatitics
        .slice(0, TargetNumExamples)
        .map((line) => `// ${line}`)
        .join('\n')}${computedStatitics.length > TargetNumExamples ? '\n// …' : ''}`;
    });

    return addJsCodeBlock(updatedStatisticsSnippets.join(''));
  });

  return { content: refinedBlocks.join(''), numExecutedSnippets };
}
