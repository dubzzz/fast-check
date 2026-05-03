import * as path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFile = promisify(_execFile);

const generatedTestsDirectoryName = '.test-artifacts-fuzz';
const generatedTestsDirectory = path.join(import.meta.dirname, '..', generatedTestsDirectoryName);
const specFileName = `generated.spec.mjs`;
const vitestConfigName = `vitest.config.mjs`;
const binPath = path.resolve(import.meta.dirname, '..', 'bin', 'fuzz.mjs');

beforeAll(async () => {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
});
afterAll(async () => {
  await fs.rm(generatedTestsDirectory, { recursive: true });
});

let num = -1;

async function writeCountingSpec(
  mode: 'prop' | 'implicit-g' | 'plain',
): Promise<{ specDirectory: string; counterFile: string }> {
  const specDirectorySeed = `${Math.random().toString(16).substring(2)}-${++num}`;
  const specDirectory = path.join(generatedTestsDirectory, `fuzz-${specDirectorySeed}`);
  await fs.mkdir(specDirectory, { recursive: true });

  const counterFile = path.join(specDirectory, 'counter.txt');

  let testBody: string;
  if (mode === 'prop') {
    testBody = [
      "import { test } from '@fast-check/vitest';",
      "import * as fc from 'fast-check';",
      "import { writeFileSync, existsSync, readFileSync } from 'fs';",
      `const counterFile = ${JSON.stringify(counterFile)};`,
      'function increment() {',
      "  const c = existsSync(counterFile) ? parseInt(readFileSync(counterFile, 'utf8'), 10) : 0;",
      '  writeFileSync(counterFile, String(c + 1));',
      '}',
      "test.prop([fc.nat()])('counting', (_n) => { increment(); });",
    ].join('\n');
  } else if (mode === 'implicit-g') {
    testBody = [
      "import { test } from '@fast-check/vitest';",
      "import * as fc from 'fast-check';",
      "import { writeFileSync, existsSync, readFileSync } from 'fs';",
      `const counterFile = ${JSON.stringify(counterFile)};`,
      'function increment() {',
      "  const c = existsSync(counterFile) ? parseInt(readFileSync(counterFile, 'utf8'), 10) : 0;",
      '  writeFileSync(counterFile, String(c + 1));',
      '}',
      "test('counting', ({ g }) => { g(fc.nat); increment(); });",
    ].join('\n');
  } else {
    testBody = [
      "import { test } from '@fast-check/vitest';",
      "import { writeFileSync, existsSync, readFileSync } from 'fs';",
      `const counterFile = ${JSON.stringify(counterFile)};`,
      'function increment() {',
      "  const c = existsSync(counterFile) ? parseInt(readFileSync(counterFile, 'utf8'), 10) : 0;",
      '  writeFileSync(counterFile, String(c + 1));',
      '}',
      "test('counting', () => { increment(); });",
    ].join('\n');
  }

  const vitestConfig =
    `import { defineConfig } from 'vite';\n` +
    `export default defineConfig({ test: { include: ['${specFileName}'] } });`;

  await Promise.all([
    fs.writeFile(path.join(specDirectory, specFileName), testBody),
    fs.writeFile(path.join(specDirectory, vitestConfigName), vitestConfig),
  ]);

  return { specDirectory, counterFile };
}

async function runSpecWithEnv(
  specDirectory: string,
  env: Record<string, string>,
): Promise<void> {
  try {
    await execFile(
      'node',
      ['../../node_modules/vitest/vitest.mjs', '--config', vitestConfigName, '--run', '--no-color'],
      { cwd: specDirectory, env: { ...process.env, ...env } },
    );
  } catch {
    // test might fail, that's ok for counting
  }
}

async function runFuzzBin(specDirectory: string, extraArgs: string[] = []): Promise<void> {
  try {
    await execFile(
      'node',
      [binPath, '--config', vitestConfigName, '--run', '--no-color', ...extraArgs],
      { cwd: specDirectory },
    );
  } catch {
    // test might fail, that's ok for counting
  }
}

async function readCount(counterFile: string): Promise<number> {
  const content = await fs.readFile(counterFile, 'utf8');
  return parseInt(content, 10);
}

describe('FAST_CHECK_VITEST_NUM_RUNS env override', () => {
  it(
    '.prop respects override',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('prop');
      await runSpecWithEnv(specDirectory, { FAST_CHECK_VITEST_NUM_RUNS: '50' });
      expect(await readCount(counterFile)).toBe(50);
    },
    30_000,
  );

  it(
    'implicit g respects override',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('implicit-g');
      await runSpecWithEnv(specDirectory, { FAST_CHECK_VITEST_NUM_RUNS: '50' });
      expect(await readCount(counterFile)).toBe(50);
    },
    30_000,
  );

  it(
    'plain test is unaffected by override',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('plain');
      await runSpecWithEnv(specDirectory, { FAST_CHECK_VITEST_NUM_RUNS: '50' });
      expect(await readCount(counterFile)).toBe(1);
    },
    30_000,
  );
});

describe('fuzz bin', () => {
  it(
    'passes --num to vitest via env var',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('prop');
      await runFuzzBin(specDirectory, ['--num', '75']);
      expect(await readCount(counterFile)).toBe(75);
    },
    30_000,
  );

  it(
    'defaults to 100 when --num is omitted',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('prop');
      await runFuzzBin(specDirectory);
      expect(await readCount(counterFile)).toBe(100);
    },
    30_000,
  );

  it(
    'supports --num=N syntax',
    async () => {
      const { specDirectory, counterFile } = await writeCountingSpec('prop');
      await runFuzzBin(specDirectory, ['--num=60']);
      expect(await readCount(counterFile)).toBe(60);
    },
    30_000,
  );
});
