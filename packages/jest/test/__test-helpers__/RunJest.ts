import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import { expect } from 'vitest';

const execFile = promisify(_execFile);

const generatedTestsDirectoryName = '.test-artifacts';
export const generatedTestsDirectory: string = path.join(import.meta.dirname, '..', '..', generatedTestsDirectoryName);

const specFileName = `generated.spec.cjs`;
const jestConfigName = `jest.config.cjs`;

let num = -1;

export async function writeToFile(
  runner: 'test' | 'it',
  options: { useWorkers: boolean; testTimeoutConfig?: number; testRunner?: 'jasmine' },
  fileContent: () => void,
): Promise<string> {
  const { useWorkers } = options;

  // Prepare directory for spec
  const specDirectorySeed = `${Math.random().toString(16).substring(2)}-${++num}`;
  const specDirectory = path.join(generatedTestsDirectory, `test-${specDirectorySeed}`);
  await fs.mkdir(specDirectory, { recursive: true });

  // Prepare test file itself
  const specFileName = `generated.spec.cjs`;
  const specFilePath = path.join(specDirectory, specFileName);
  let fileContentString = String(fileContent);
  if (fileContentString.includes('expect')) {
    // "expect" would be replaced by Vitest by "__vite_ssr_import_0__.expect"
    throw new Error('Drop any reference to expect to avoid running against the one from Vitest: use jestExpect');
  }
  fileContentString = fileContentString.replace(/jestExpect/g, 'expect');
  const wrapInDescribeIfNeeded =
    runner === 'it'
      ? (testCode: string) => `describe('test suite', () => {\n${testCode}\n});`
      : (testCode: string) => testCode;
  const importFromFastCheckJest = useWorkers
    ? `const {pathToFileURL} = require('node:url');\nconst {${runner}: runner, expect} = require('@fast-check/jest/worker').init(pathToFileURL(__filename));\n`
    : `const {${runner}: runner} = require('@fast-check/jest');\n`;
  const specContent =
    "const fc = require('fast-check');\n" +
    importFromFastCheckJest +
    wrapInDescribeIfNeeded(
      fileContentString.substring(fileContentString.indexOf('{') + 1, fileContentString.lastIndexOf('}')),
    );

  // Prepare jest config itself
  const jestConfigPath = path.join(specDirectory, jestConfigName);
  const jestConfig = {
    testMatch: [`<rootDir>/${specFileName}`],
    transform: { '^.+\\.[t|j]sx?$': 'babel-jest' },
    ...(useWorkers ? { transformIgnorePatterns: ['/node_modules/(?!(?:@fast-check/worker)/)'] } : {}),
    testTimeout: options.testTimeoutConfig,
    testRunner: options.testRunner !== undefined ? 'jest-jasmine2' : undefined,
  };

  // Prepare babel config
  const babelConfigPath = path.join(specDirectory, 'babel.config.cjs');
  const babelConfig = `module.exports = { presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]], };`;

  // Write the files
  await Promise.all([
    fs.writeFile(specFilePath, specContent),
    fs.writeFile(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig)};`),
    fs.writeFile(babelConfigPath, babelConfig),
  ]);

  return specDirectory;
}

// Environment with AI agent env vars removed so that Jest uses its default reporter
// instead of the AgentReporter (which strips verbose test result markers).
const jestEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !['AI_AGENT', 'AUGMENT_AGENT', 'CLAUDE_CODE', 'CLAUDECODE', 'CODEX_SANDBOX', 'CODEX_THREAD_ID'].includes(key) &&
      !['CURSOR_AGENT', 'GEMINI_CLI', 'GOOSE_PROVIDER', 'OPENCODE', 'REPL_ID'].includes(key),
  ),
);

export async function runSpec(
  specDirectory: string,
  opts: { jestSeed?: number; testTimeoutCLI?: number } = {},
): Promise<string> {
  try {
    const { stderr: specOutput } = await execFile(
      'node',
      [
        '../../node_modules/jest/bin/jest.js',
        '--config',
        jestConfigName,
        '--show-seed',
        ...(opts.jestSeed !== undefined ? ['--seed', String(opts.jestSeed)] : []),
        ...(opts.testTimeoutCLI !== undefined ? [`--testTimeout=${opts.testTimeoutCLI}`] : []),
      ],
      { cwd: specDirectory, env: jestEnv },
    );
    return specOutput;
  } catch (err) {
    return (err as any).stderr;
  }
}

export function expectPass(out: string): void {
  expect(out).toMatch(new RegExp('PASS .*/' + specFileName));
}

export function expectFail(out: string): void {
  expect(out).toMatch(new RegExp('FAIL .*/' + specFileName));
}

export function expectTimeout(out: string, timeout: number): void {
  expect(out).toContain('Property interrupted after 0 tests');
  const timeRegex = /[×✕] .* \(with seed=-?\d+\) \((\d+) ms\)/;
  expect(out).toMatch(timeRegex);
  const time = timeRegex.exec(out)!;
  expect(Number(time[1])).toBeGreaterThanOrEqual(timeout);
  expect(Number(time[1])).toBeLessThan(timeout * 2);
}

export function expectAlignedSeeds(out: string, opts: { noAlignWithJest?: boolean } = {}): void {
  // Seed printed by jest has the shape:
  // >   Seed:        -518086725
  // >   Test Suites: 1 failed, 1 total
  // >   Tests:       1 failed, 1 total
  // >   Snapshots:   0 total
  // >   Time:        0.952 s
  // >   Ran all test suites
  const JestSeedMatcher = /Seed:\s+(-?\d+)/;
  expect(out).toMatch(JestSeedMatcher);
  const jestSeed = JestSeedMatcher.exec(out)![1];
  // Seed printed by jest-fast-check next to test name has the shape:
  // >   × property fail on falsy property (with seed=-518086725)
  const JestFastCheckSeedMatcher = opts.noAlignWithJest
    ? /[×✕] .* \(with seed=(-?\d+)\)/
    : new RegExp('[×✕] .* \\(with seed=(' + jestSeed + ')\\)');
  expect(out).toMatch(JestFastCheckSeedMatcher);
  const jestFastCheckSeed = JestFastCheckSeedMatcher.exec(out)![1];
  // Seed printed by fast-check in case of failure has the shape:
  // >   Property failed after 1 tests
  // >   { seed: -518086725, path: \"0\", endOnFailure: true }
  expect(out).toMatch(new RegExp('\\{[^}]*seed\\s*:\\s*' + jestFastCheckSeed + '[^\\d]'));
}
