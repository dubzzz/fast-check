import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);

import _fc from 'fast-check';
import { testProp as _testProp, itProp as _itProp } from '@fast-check/jest';
declare const fc: typeof _fc;
declare const runnerProp: typeof _testProp | typeof _itProp;

const generatedTestsDirectoryName = 'generated-tests';
const generatedTestsDirectory = path.join(__dirname, generatedTestsDirectoryName);

type RunnerType = 'testProp' | 'itProp';

jest.setTimeout(60_000);

beforeAll(async () => {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
});
afterAll(async () => {
  await fs.rm(generatedTestsDirectory, { recursive: true });
});

describe.each<{ runner: RunnerType }>([{ runner: 'testProp' }, { runner: 'itProp' }])('$runner', ({ runner }) => {
  it.concurrent('should pass on truthy synchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property pass sync', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectPass(out, specFileName);
    expect(out).toMatch(/√ property pass sync \(with seed=\d+\)/);
  });

  it.concurrent('should pass on truthy asynchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property pass async', [fc.string(), fc.string(), fc.string()], async (a, b, c) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectPass(out, specFileName);
    expect(out).toMatch(/√ property pass async \(with seed=\d+\)/);
  });

  it.concurrent('should fail on falsy synchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property fail sync', [fc.nat()], (a) => {
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expect(out).toMatch(/× property fail sync \(with seed=\d+\)/);
  });

  it.concurrent('should fail on falsy asynchronous property', async () => {
    // Arrange
    const { specFileName, jestConfigRelativePath } = await writeToFile(runner, () => {
      runnerProp('property fail async', [fc.nat()], async (a) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(jestConfigRelativePath);

    // Assert
    expectFail(out, specFileName);
    expect(out).toMatch(/× property fail async \(with seed=\d+\)/);
  });
});

// Helper

async function writeToFile(
  runner: 'testProp' | 'itProp',
  fileContent: () => void
): Promise<{ specFileName: string; jestConfigRelativePath: string }> {
  const specFileSeed = Math.random().toString(16).substring(2);

  // Prepare test file itself
  const specFileName = `generated-${specFileSeed}.spec.js`;
  const specFilePath = path.join(generatedTestsDirectory, specFileName);
  const fileContentString = String(fileContent);
  const wrapInDescribeIfNeeded =
    runner === 'itProp'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const specContent =
    "const fc = require('fast-check');\n" +
    `const {${runner}: runnerProp} = require('@fast-check/jest');\n` +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}'))
    );

  // Prepare jest config itself
  const jestConfigName = `jest.config-${specFileSeed}.js`;
  const jestConfigRelativePath = `test/${generatedTestsDirectoryName}/${jestConfigName}`;
  const jestConfigPath = path.join(generatedTestsDirectory, jestConfigName);

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(jestConfigPath, `module.exports = { testMatch: ['<rootDir>/${specFileName}'] };`),
  ]);

  return { specFileName, jestConfigRelativePath };
}

async function runSpec(jestConfigRelativePath: string): Promise<string> {
  const { stdout: jestBinaryPathCommand } = await execFile('yarn', ['bin', 'jest'], { shell: true });
  const jestBinaryPath = jestBinaryPathCommand.split('\n')[0];
  try {
    const { stderr: specOutput } = await execFile('node', [jestBinaryPath, '--config', jestConfigRelativePath]);
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

function expectPass(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('PASS .*/' + specFileName));
}

function expectFail(out: string, specFileName: string): void {
  expect(out).toMatch(new RegExp('FAIL .*/' + specFileName));
}
