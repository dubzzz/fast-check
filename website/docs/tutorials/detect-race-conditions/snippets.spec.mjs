import { jest } from '@jest/globals';
import * as path from 'path';
import * as url from 'url';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);
import {
  queueCodeV0,
  queueCodeV1,
  queueCodeV2,
  queueCodeV3,
  queueCodeV4,
  queueCodeV5,
  queueUnitSpecCode,
  queueBasicPBTSpecCode,
  queueBasicPBTWaitAllSpecCode,
  queueMoreThan2CallsPBTSpecCode,
  queueFromBatchesPBTSpecCode,
  queueBatchesAlternativePBTSpecCode,
  missingPartPBTSpecCode,
  extendedBackToWaitAllPBTSpecCode,
  extendedWithExceptionsPBTSpecCode,
} from './snippets.mjs';
import { cwd } from 'process';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const generatedTestsDirectoryName = 'generated-tests';
const generatedTestsDirectory = path.join(__dirname, generatedTestsDirectoryName);

const allQueueSpecs = {
  unit: queueUnitSpecCode,
  part1: queueBasicPBTSpecCode,
  part1WaitAll: queueBasicPBTWaitAllSpecCode,
  part2: queueMoreThan2CallsPBTSpecCode,
  part3: queueFromBatchesPBTSpecCode,
  part3NoBatch: queueBatchesAlternativePBTSpecCode,
  part4: missingPartPBTSpecCode,
  extendedWaitAll: extendedBackToWaitAllPBTSpecCode,
  extendedExceptions: extendedWithExceptionsPBTSpecCode,
};
const allQueueSnippets = {
  v0: { code: queueCodeV0, greenTests: ['unit'] },
  v1: { code: queueCodeV1, greenTests: ['unit', 'part1', 'part1WaitAll'] },
  v2: { code: queueCodeV2, greenTests: ['unit', 'part1', 'part2'] },
  v3: { code: queueCodeV3, greenTests: ['unit', 'part1', 'part2', 'part3', 'part3NoBatch'] },
  v4: { code: queueCodeV4, greenTests: ['unit', 'part1', 'part1WaitAll', 'part2', 'part3', 'part3NoBatch', 'part4'] },
  v5: { code: queueCodeV5, greenTests: Object.keys(allQueueSpecs) },
};

let jestBinaryPath = undefined;
beforeAll(async () => {
  const { stdout: jestBinaryPathCommand } = await execFile('yarn', ['bin', 'jest'], { shell: true });
  jestBinaryPath = jestBinaryPathCommand.split('\n')[0];
});

afterAll(async () => {
  await fs.rmdir(generatedTestsDirectory);
});

jest.setTimeout(60_000);

describe('Playground', () => {
  for (const [snippetLabel, snippet] of Object.entries(allQueueSnippets)) {
    describe(`snippet ${snippetLabel}`, () => {
      for (const [specLabel, specCode] of Object.entries(allQueueSpecs)) {
        const expectedSuccess = snippet.greenTests.includes(specLabel);
        const friendlyStatus = expectedSuccess ? 'pass' : 'fail';
        it.concurrent(`should ${friendlyStatus} on ${specLabel}`, async () => {
          const seed = Math.random().toString(16).substring(2);
          const testDirectoryName = `test-${seed}`;
          const testDirectoryPath = path.join(generatedTestsDirectory, testDirectoryName);
          const sourceFilePath = path.join(testDirectoryPath, `queue.mjs`);
          const specFilePath = path.join(testDirectoryPath, `queue.spec.mjs`);
          const jestConfigPath = path.join(testDirectoryPath, `jest.config.cjs`);
          const sanitizedSpecCode =
            "import { jest } from '@jest/globals';\n" + specCode.replace('queue.js', 'queue.mjs');
          try {
            await fs.mkdir(testDirectoryPath, { recursive: true });
            await fs.writeFile(sourceFilePath, snippet.code);
            await fs.writeFile(specFilePath, sanitizedSpecCode);
            await fs.writeFile(jestConfigPath, `module.exports = { testMatch: ['<rootDir>/*.spec.mjs'] }`);
            const specOutput = await runJest(jestConfigPath);
            if (expectedSuccess) {
              expect(specOutput).toContain('1 passed');
              expect(specOutput).not.toContain('1 failed');
              expect(specOutput).not.toContain('ERR_UNHANDLED_REJECTION');
            } else {
              expect(specOutput).not.toContain('1 passed');
              try {
                expect(specOutput).toContain('1 failed');
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

async function runJest(jestConfigPath) {
  expect(jestBinaryPath).toBeDefined();
  try {
    const { stderr: specOutput } = await execFile('node', [
      '--experimental-vm-modules',
      jestBinaryPath,
      '--config',
      path.relative(cwd(), jestConfigPath),
    ]);
    return specOutput;
  } catch (err) {
    return err.stderr;
  }
}
