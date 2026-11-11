import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = join(import.meta.dirname, 'asyncProperty/fixtures');
const artifacts = fileURLToPath(new URL('../../.test-artifacts/', import.meta.url));
const cli = fileURLToPath(new URL('../../src/cli.ts', import.meta.url));
const cases = readdirSync(fixtures, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function runCodemod(): void {
  execFileSync(process.execPath, [cli, 'v5/asyncProperty', artifacts, '--cpus=1'], { stdio: 'inherit' });
}

describe('v5/asyncProperty', () => {
  beforeAll(() => {
    rmSync(artifacts, { recursive: true, force: true });
    mkdirSync(artifacts, { recursive: true });
    for (const name of cases) {
      copyFileSync(join(fixtures, name, 'actual.ts'), join(artifacts, `${name}.ts`));
    }
    runCodemod();
  });

  it.each(cases)('transforms %s', (name) => {
    expect(readFileSync(join(artifacts, `${name}.ts`), 'utf8')).toBe(
      readFileSync(join(fixtures, name, 'expected.ts'), 'utf8'),
    );
  });

  it('can run again without changing the result', () => {
    runCodemod();
    for (const name of cases) {
      expect(readFileSync(join(artifacts, `${name}.ts`), 'utf8')).toBe(
        readFileSync(join(fixtures, name, 'expected.ts'), 'utf8'),
      );
    }
  });
});
