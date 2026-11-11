import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = join(import.meta.dirname, 'fixture');
const artifacts = fileURLToPath(new URL('../.test-artifacts/', import.meta.url));
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

function directories(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const versions = directories(fixtures).map((version) => ({
  version,
  codemods: directories(join(fixtures, version)).map((codemod) => ({
    codemod,
    cases: directories(join(fixtures, version, codemod)),
  })),
}));

function runCodemod(version: string, codemod: string): void {
  execFileSync(process.execPath, [cli, `${version}/${codemod}`, join(artifacts, version, codemod), '--cpus=1'], {
    stdio: 'inherit',
  });
}

beforeAll(() => {
  rmSync(artifacts, { recursive: true, force: true });
  for (const { version, codemods } of versions) {
    for (const { codemod, cases } of codemods) {
      const target = join(artifacts, version, codemod);
      mkdirSync(target, { recursive: true });
      for (const name of cases) {
        copyFileSync(join(fixtures, version, codemod, name, 'actual.ts'), join(target, `${name}.ts`));
      }
      runCodemod(version, codemod);
    }
  }
});

afterAll(() => {
  rmSync(artifacts, { recursive: true, force: true });
});

describe.each(versions)('$version', ({ version, codemods }) => {
  describe.each(codemods)('$codemod', ({ codemod, cases }) => {
    it.each(cases)('%s', (name) => {
      expect(readFileSync(join(artifacts, version, codemod, `${name}.ts`), 'utf8')).toBe(
        readFileSync(join(fixtures, version, codemod, name, 'expected.ts'), 'utf8'),
      );
    });

    it('can run again without changing the result', () => {
      runCodemod(version, codemod);
      for (const name of cases) {
        expect(readFileSync(join(artifacts, version, codemod, `${name}.ts`), 'utf8')).toBe(
          readFileSync(join(fixtures, version, codemod, name, 'expected.ts'), 'utf8'),
        );
      }
    });
  });
});
