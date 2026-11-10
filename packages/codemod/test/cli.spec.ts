import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../lib/cli.cjs', import.meta.url));
const directories: string[] = [];
const source = "import fc from 'fast-check';\nfc.asyncProperty(arb, async (n) => n);\n";

function fixture(): string {
  const directory = mkdtempSync(join(tmpdir(), 'fast-check-codemod-'));
  directories.push(directory);
  return directory;
}

function run(...args: string[]): string {
  return execFileSync(process.execPath, [cli, 'v5/no-asyncProperty', ...args, '--run-in-band'], { encoding: 'utf8' });
}

beforeAll(() => {
  execFileSync(
    process.execPath,
    [fileURLToPath(new URL('./bin/cli.mjs', import.meta.resolve('rolldown/package.json'))), '-c'],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
    },
  );
});

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('CLI', () => {
  it('migrates folders recursively, skips node_modules, and is safe to run twice', () => {
    const directory = fixture();
    mkdirSync(join(directory, 'nested'));
    mkdirSync(join(directory, 'node_modules'));
    const files = ['test.js', 'nested/test.ts', 'test.jsx', 'test.tsx', 'test.mjs', 'test.cjs', 'test.mts', 'test.cts'];
    for (const file of [...files, 'node_modules/ignored.js', 'ignored.txt']) {
      writeFileSync(join(directory, file), source);
    }
    run(directory);
    run(directory);
    for (const file of files) {
      expect(readFileSync(join(directory, file), 'utf8')).toBe(source.replace('asyncProperty', 'property'));
    }
    expect(readFileSync(join(directory, 'node_modules/ignored.js'), 'utf8')).toBe(source);
    expect(readFileSync(join(directory, 'ignored.txt'), 'utf8')).toBe(source);
  });

  it('supports a single file and dry runs', () => {
    const file = join(fixture(), 'test.js');
    writeFileSync(file, source);
    expect(run(file, '--dry', '--print')).toContain('fc.property');
    expect(readFileSync(file, 'utf8')).toBe(source);
    run(file);
    expect(readFileSync(file, 'utf8')).toBe(source.replace('asyncProperty', 'property'));
  });

  it.each([[], ['unknown', '.'], ['v5/no-asyncProperty'], ['v5/no-asyncProperty', '--dry']].map((args) => [args]))(
    'rejects invalid arguments %j',
    (args) => {
      const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Usage:');
    },
  );

  it('prints help', () => {
    expect(execFileSync(process.execPath, [cli, '--help'], { encoding: 'utf8' })).toContain('v5/no-asyncProperty');
  });

  it('rejects missing paths', () => {
    const result = spawnSync(process.execPath, [cli, 'v5/no-asyncProperty', join(fixture(), 'missing')], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Path does not exist:');
  });

  it('reports parse errors with a nonzero exit code and keeps the file unchanged', () => {
    const file = join(fixture(), 'test.js');
    writeFileSync(file, 'const = ;');
    const result = spawnSync(process.execPath, [cli, 'v5/no-asyncProperty', file, '--run-in-band']);
    expect(result.status).not.toBe(0);
    expect(readFileSync(file, 'utf8')).toBe('const = ;');
  });
});
