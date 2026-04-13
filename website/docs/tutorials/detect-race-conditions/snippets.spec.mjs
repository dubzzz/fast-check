// @ts-check
import { afterAll, describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import * as snippets from './snippets.mjs';
const execFile = promisify(_execFile);
const rootWebsite = path.join(import.meta.dirname, '..', '..', '..');

const generatedTestsDirectoryName = '.test-artifacts';
const generatedTestsDirectory = path.join(rootWebsite, generatedTestsDirectoryName);

const vitestBinaryPath = path.join(rootWebsite, './node_modules/vitest/vitest.mjs');
const vitestConfigName = 'vitest.config.mjs';

const allQueueSpecs = {
  unit: snippets.queueUnitSpecCode,
  part1: snippets.queueBasicPBTSpecCode,
  part1WaitAll: snippets.queueBasicPBTWaitAllSpecCode,
  part2: snippets.queueMoreThan2CallsPBTSpecCode,
  part3: snippets.queueFromBatchesPBTSpecCode,
  part3NoBatch: snippets.queueBatchesAlternativePBTSpecCode,
  part4: snippets.missingPartPBTSpecCode,
  extendedWaitAll: snippets.extendedBackToWaitAllPBTSpecCode,
  extendedExceptions: snippets.extendedWithExceptionsPBTSpecCode,
};
const allQueueSnippets = {
  v0: {
    code: snippets.queueCodeV0,
    greenTests: ['unit'],
  },
  v1: {
    code: snippets.queueCodeV1,
    greenTests: ['unit', 'part1'],
  },
  v2: {
    code: snippets.queueCodeV2,
    greenTests: ['unit', 'part1', 'part2'],
  },
  v3: {
    code: snippets.queueCodeV3,
    greenTests: ['unit', 'part1', 'part2', 'part3', 'part3NoBatch'],
  },
  v4: {
    code: snippets.queueCodeV4,
    greenTests: ['unit', 'part1', 'part1WaitAll', 'part2', 'part3', 'part3NoBatch', 'part4'],
  },
  v5: {
    code: snippets.queueCodeV5,
    greenTests: Object.keys(allQueueSpecs),
  },
};

beforeAll(async () => {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
});
afterAll(async () => {
  await fs.rm(generatedTestsDirectory, { recursive: true });
});

describe('Playground', () => {
  for (const [snippetLabel, snippet] of Object.entries(allQueueSnippets)) {
    describe.concurrent(`snippet ${snippetLabel}`, () => {
      for (const [specLabel, specCode] of Object.entries(allQueueSpecs)) {
        const expectedSuccess = snippet.greenTests.includes(specLabel);
        const friendlyStatus = expectedSuccess ? 'pass' : 'fail';
        it.concurrent(`should ${friendlyStatus} on ${specLabel}`, async () => {
          const seed = Math.random().toString(16).substring(2);
          const testDirectoryName = `test-${seed}`;
          const testDirectoryPath = path.join(generatedTestsDirectory, testDirectoryName);
          const sourceFilePath = path.join(testDirectoryPath, `queue.mjs`);
          const specFilePath = path.join(testDirectoryPath, `queue.spec.mjs`);
          const vitestConfigPath = path.join(testDirectoryPath, vitestConfigName);
          const sanitizedSpecCode =
            "import { vi as jest, test, expect } from 'vitest';\n" + specCode.replace('queue.js', 'queue.mjs');
          try {
            await fs.mkdir(testDirectoryPath, { recursive: true });
            await fs.writeFile(sourceFilePath, snippet.code);
            await fs.writeFile(specFilePath, sanitizedSpecCode);
            await fs.writeFile(
              vitestConfigPath,
              `import { defineConfig } from 'vitest/config';\nexport default defineConfig({ test: { include: ['queue.spec.mjs'] } });`,
            );
            const specOutput = await runVitest(testDirectoryPath);
            if (expectedSuccess) {
              expect(specOutput).toContain('1 passed');
              expect(specOutput).not.toContain('1 failed');
            } else {
              expect(specOutput).not.toContain('1 passed');
              expect(specOutput).toContain('1 failed');
            }
          } finally {
            await fs.rm(testDirectoryPath, { recursive: true });
          }
        });
      }
    });
  }
});

// Helpers

/**
 * @param {string} testDirectoryPath
 * @returns
 */
async function runVitest(testDirectoryPath) {
  try {
    const { stdout, stderr } = await execFile(
      'node',
      [vitestBinaryPath, '--config', vitestConfigName, '--run', '--no-color'],
      { cwd: testDirectoryPath },
    );
    return stdout + stderr;
  } catch (err) {
    // @ts-ignore
    return err.stdout + err.stderr;
  }
}
