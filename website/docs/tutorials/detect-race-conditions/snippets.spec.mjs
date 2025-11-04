// @ts-check
import { afterAll, describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as url from 'url';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import * as snippets from './snippets.mjs';
import { cwd } from 'process';

const execFile = promisify(_execFile);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const rootWebsite = path.join(__dirname, '..', '..', '..');

const generatedTestsDirectoryName = 'generated-tests';
const generatedTestsDirectory = path.join(rootWebsite, generatedTestsDirectoryName);

const vitestBinaryPath = path.join(rootWebsite, './node_modules/vitest/vitest.mjs');

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
          const sanitizedSpecCode =
            "import { vi, test, expect, describe } from 'vitest';\n" + specCode.replace('queue.js', 'queue.mjs').replace(/\bjest\b/g, 'vi');
          try {
            await fs.mkdir(testDirectoryPath, { recursive: true });
            await fs.writeFile(sourceFilePath, snippet.code);
            await fs.writeFile(specFilePath, sanitizedSpecCode);
            // Create node_modules symlink to allow resolving fast-check
            const nodeModulesPath = path.join(testDirectoryPath, 'node_modules');
            const fastCheckSource = path.join(rootWebsite, 'node_modules', 'fast-check');
            const fastCheckDest = path.join(nodeModulesPath, 'fast-check');
            await fs.mkdir(nodeModulesPath, { recursive: true });
            try {
              await fs.symlink(fastCheckSource, fastCheckDest, 'dir');
            } catch (symlinkErr) {
              // Symlink might already exist, ignore error
              if (symlinkErr.code !== 'EEXIST') throw symlinkErr;
            }
            const specOutput = await runVitest(testDirectoryPath, specFilePath);
            if (expectedSuccess) {
              expect(specOutput).toMatch(/Tests\s+1 passed/);
              expect(specOutput).not.toMatch(/Tests\s+1 failed/);
              expect(specOutput).not.toContain('ERR_UNHANDLED_REJECTION');
            } else {
              expect(specOutput).not.toMatch(/Tests\s+1 passed/);
              try {
                expect(specOutput).toMatch(/Tests\s+1 failed/);
              } catch (err) {
                expect(specOutput).toContain('ERR_UNHANDLED_REJECTION');
              }
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

async function runVitest(testDirectoryPath, specFilePath) {
  try {
    const { stdout: specOutput, stderr: specError } = await execFile(
      'node',
      ['--experimental-vm-modules', vitestBinaryPath, 'run', specFilePath, '--reporter=verbose'],
      { 
        cwd: testDirectoryPath, 
        maxBuffer: 10 * 1024 * 1024, 
        timeout: 10000
      }, // 10MB buffer, 10s timeout
    );
    return specOutput + specError;
  } catch (err) {
    if (err.killed) {
      return (err.stdout || '') + (err.stderr || '') + '\n[TIMEOUT]';
    }
    return (err.stdout || '') + (err.stderr || '');
  }
}
