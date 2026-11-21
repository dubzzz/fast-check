import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const fixtures = import.meta.dirname;
const tarball = resolve(fixtures, '../../package.tgz');
const packageManager = process.env.npm_execpath;
if (packageManager === undefined) throw new Error('Run this check with pnpm run test-consumer-types');
const isJavaScriptCli = ['.js', '.cjs', '.mjs'].includes(extname(packageManager));
const installCommand = isJavaScriptCli ? process.execPath : packageManager;
const installArgs = [
  ...(isJavaScriptCli ? [packageManager] : []),
  'install',
  '--ignore-scripts',
  '--ignore-workspace',
  '--no-frozen-lockfile',
];
const versions = process.argv.slice(2);
if (versions.length === 0) versions.push('5.8', 'latest');

for (const version of versions) {
  for (const environment of ['node', 'browser']) {
    // Outside the checkout so imports cannot resolve monorepo development dependencies.
    const directory = mkdtempSync(join(tmpdir(), 'fast-check-consumer-'));
    try {
      const packageJson = {
        private: true,
        type: 'module',
        dependencies: { 'fast-check': `file:${tarball}` },
        devDependencies: {
          typescript: version,
          ...(environment === 'node' ? { '@types/node': '22.12.0' } : {}),
        },
      };
      writeFileSync(join(directory, 'package.json'), JSON.stringify(packageJson));
      copyFileSync(join(fixtures, `tsconfig.${environment}.json`), join(directory, 'tsconfig.json'));
      copyFileSync(join(fixtures, 'main.ts'), join(directory, 'main.mts'));
      if (environment === 'node') copyFileSync(join(fixtures, 'main.ts'), join(directory, 'main.cts'));

      console.log(`Checking ${environment} consumer with TypeScript ${version}`);
      execFileSync(installCommand, installArgs, { cwd: directory, stdio: 'inherit' });
      execFileSync(process.execPath, [join(directory, 'node_modules/typescript/bin/tsc'), '-p', directory], {
        cwd: directory,
        stdio: 'inherit',
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}
