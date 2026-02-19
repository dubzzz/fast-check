import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import fc from '../../../src/fast-check.js';

const TargetNumExamples = 5;
const JsBlockStart = '```js';
const JsBlockEnd = '```';
const CommentForGeneratedValues = '// Examples of generated values:';
const CommentForArbitraryIndicator = '// Use the arbitrary:';
const CommentForStatistics = '// Computed statistics for 10k generated values:';

const allPathsFromWebsite = fs
  .globSync(`./website/docs/core-blocks/arbitraries/**/*.md`, {
    withFileTypes: true,
  })
  .filter((fileDescriptor) => fileDescriptor.isFile())
  .map((fileDescriptor) => ({
    filePath: path.join(fileDescriptor.parentPath, fileDescriptor.name),
    shortName: fileDescriptor.name,
  }));

// Linked to https://github.com/vitest-dev/vitest/discussions/6511#discussioncomment-13145786
afterEach(async () => {
  // already existing afterEach code goes here
  await new Promise((res) => setImmediate(res));
});

describe('Docs.md', () => {
  if (process.env.SKIP_EXPENSIVE === 'true') {
    it('should skip expensive tests', () => {});
    return;
  }
  it.each(allPathsFromWebsite)(
    'should check code snippets validity and fix generated values on $shortName',
    ({ filePath }) => {
      const originalFileContent = fs.readFileSync(filePath).toString();
      const { content: fileContent } = refreshContent(originalFileContent);

      if (fileContent !== originalFileContent && process.env.UPDATE_CODE_SNIPPETS) {
        console.warn(`Updating code snippets defined in the documentation...`);
        fs.writeFileSync(filePath, fileContent);
      }
      if (!process.env.UPDATE_CODE_SNIPPETS) {
        expect(fileContent).toEqual(originalFileContent);
      }
    },
  );
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
        const lastIndexCommentForStatistics = snippet.lastIndexOf(CommentForStatistics);
        const refinedSnippet =
          lastIndexCommentForStatistics !== -1 ? snippet.substring(lastIndexCommentForStatistics) : snippet;
        const seed = refinedSnippet.replace(/\s*\/\/.*/g, '').replace(/\s+/gm, ' ').length;
        const indexArbitraryPart = refinedSnippet.indexOf(CommentForArbitraryIndicator);
        const preparationPart = indexArbitraryPart !== -1 ? refinedSnippet.substring(0, indexArbitraryPart) : '';
        const arbitraryPart = indexArbitraryPart !== -1 ? refinedSnippet.substring(indexArbitraryPart) : refinedSnippet;
        const santitizeArbitraryPart = arbitraryPart
          .trim()
          .replace(/;$/, '')
          .replace(/;\n\/\/.*$/m, '\n//');
        const evalCode = `${preparationPart}\nfc.sample(${santitizeArbitraryPart}\n, { numRuns: ${numRuns}, seed: ${seed} }).map(v => fc.stringify(v))`;
        try {
          return eval(evalCode);
        } catch (err) {
          throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`, {
            cause: err,
          });
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

      const computedStatitics = (baseSize: fc.Size) =>
        (function (fc): string[] {
          const lastIndexCommentForGeneratedValues = snippet.lastIndexOf(CommentForGeneratedValues);
          const refinedSnippet =
            lastIndexCommentForGeneratedValues !== -1 ? snippet.substring(lastIndexCommentForGeneratedValues) : snippet;
          const seed = refinedSnippet.replace(/\s*\/\/.*/g, '').replace(/\s+/gm, ' ').length;
          const evalCode = refinedSnippet;
          const originalConsoleLog = console.log;
          const originalGlobal = fc.readConfigureGlobal();
          try {
            const lines: string[] = [];
            console.log = (line) => lines.push(line);
            fc.configureGlobal({ seed, numRuns: 10000, baseSize });
            eval(evalCode);
            return lines;
          } catch (err) {
            throw new Error(`Failed to run code snippet:\n\n${evalCode}\n\nWith error message: ${err}`, { cause: err });
          } finally {
            console.log = originalConsoleLog;
            fc.configureGlobal(originalGlobal);
          }
        })(fc);
      const formatForSize = (size: fc.Size) =>
        `// For size = "${size}":\n${computedStatitics(size)
          .slice(0, TargetNumExamples)
          .map((line) => `// • ${line}`)
          .join('\n')}${computedStatitics.length > TargetNumExamples ? '\n// • …' : ''}`;
      const sizes = ['xsmall', 'small', 'medium'] as const;
      return `${snippet}\n${sizes.map((size) => formatForSize(size)).join('\n')}`;
    });

    return addJsCodeBlock(updatedStatisticsSnippets.join(''));
  });

  return { content: refinedBlocks.join(''), numExecutedSnippets };
}
