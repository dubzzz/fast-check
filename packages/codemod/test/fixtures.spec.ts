import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = join(import.meta.dirname, 'fixture');
const artifacts = fileURLToPath(new URL('../.test-artifacts/', import.meta.url));
const once = join(artifacts, 'once');
const twice = join(artifacts, 'twice');
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

function directories(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const codemods = directories(fixtures).flatMap((version) =>
  directories(join(fixtures, version)).map((codemod) => ({
    version,
    codemod,
    cases: directories(join(fixtures, version, codemod)),
  })),
);

function runCodemod(version: string, codemod: string, target: string): void {
  execFileSync(process.execPath, [cli, `${version}/${codemod}`, target, '--cpus=1'], {
    stdio: 'inherit',
  });
}

beforeAll(() => {
  rmSync(artifacts, { recursive: true, force: true });
  for (const { version, codemod, cases } of codemods) {
    const target = join(once, version, codemod);
    mkdirSync(target, { recursive: true });
    for (const name of cases) {
      copyFileSync(join(fixtures, version, codemod, name, 'actual.ts'), join(target, `${name}.ts`));
    }
    runCodemod(version, codemod, target);
    const repeated = join(twice, version, codemod);
    cpSync(target, repeated, { recursive: true });
    runCodemod(version, codemod, repeated);
  }
}, 120_000);

afterAll(() => {
  rmSync(artifacts, { recursive: true, force: true });
});

describe.each(codemods)('Codemod $version/$codemod', ({ version, codemod, cases }) => {
  it.each(cases)('should migrate %s and leave it unchanged on a second run', async (name) => {
    const migrated = readFileSync(join(once, version, codemod, `${name}.ts`), 'utf8');
    await expect(migrated).toMatchFileSnapshot(join(fixtures, version, codemod, name, 'expected.ts'));
    expect(readFileSync(join(twice, version, codemod, `${name}.ts`), 'utf8')).toBe(migrated);
  });
});
