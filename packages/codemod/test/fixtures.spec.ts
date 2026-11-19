import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile as _execFile } from 'node:child_process';
import { copyFile, cp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(_execFile);
const fixtures = join(import.meta.dirname, 'fixture');
const artifacts = fileURLToPath(new URL('../.test-artifacts/', import.meta.url));
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));

const codemods = await discoverCodemodFixtures();

describe.each(codemods)('Codemod $version/$codemod', ({ version, codemod, cases }) => {
  const artifactsDirectory = join(artifacts, version, codemod);
  const fixturesDirectory = join(fixtures, version, codemod);

  const once = join(artifactsDirectory, 'once');
  const twice = join(artifactsDirectory, 'twice');

  beforeAll(async () => {
    // Prepare a clean working directory with all test snippets for the codemod there
    await rm(artifactsDirectory, { recursive: true, force: true });
    await mkdir(once, { recursive: true });
    await Promise.all(
      cases.map((name) => copyFile(join(fixturesDirectory, name, 'actual.ts'), join(once, `${name}.ts`))),
    );

    // Run the codemod
    await runCodemod(version, codemod, once);

    // Run the codemod a second time
    await cp(once, twice, { recursive: true });
    await runCodemod(version, codemod, twice);
  }, 120_000);

  afterAll(async () => {
    await rm(artifactsDirectory, { recursive: true, force: true });
  });

  it.each(cases)('should migrate %s', async (name) => {
    const migrated = await readFile(join(once, `${name}.ts`), 'utf8');
    await expect(migrated).toMatchFileSnapshot(join(fixtures, version, codemod, name, 'expected.ts'));
  });

  it.each(cases)('should leave %s unchanged on a second run', async (name) => {
    const [migrated, actualAfterSecondRun] = await Promise.all([
      readFile(join(once, `${name}.ts`), 'utf8'),
      readFile(join(twice, `${name}.ts`), 'utf8'),
    ]);
    expect(actualAfterSecondRun).toBe(migrated);
  });
});

// Helpers

async function listSubdirectoryNames(path: string): Promise<string[]> {
  const subNames = await readdir(path, { withFileTypes: true });
  return subNames
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function discoverCodemodFixtures(): Promise<{ version: string; codemod: string; cases: string[] }[]> {
  const versions = await listSubdirectoryNames(fixtures);
  const codemodsByVersion = await Promise.all(
    versions.map(async (version) => {
      const codemodNames = await listSubdirectoryNames(join(fixtures, version));
      return codemodNames.map((codemod) => ({ version, codemod }));
    }),
  );

  const codemods = codemodsByVersion.flat();
  return Promise.all(
    codemods.map(async ({ version, codemod }) => {
      const cases = await listSubdirectoryNames(join(fixtures, version, codemod));
      return { version, codemod, cases };
    }),
  );
}

async function runCodemod(version: string, codemod: string, target: string): Promise<void> {
  await execFile(process.execPath, [cli, `${version}/${codemod}`, target, '--cpus=1']);
}
