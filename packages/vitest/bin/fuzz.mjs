#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

const rawArgs = process.argv.slice(2);
const passthrough = [];
let numRuns = '100';
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--num') {
    numRuns = rawArgs[++i];
  } else if (a.startsWith('--num=')) {
    numRuns = a.slice('--num='.length);
  } else {
    passthrough.push(a);
  }
}

const vitestPkgPath = require.resolve('vitest/package.json');
const vitestPkg = JSON.parse((await import('node:fs')).readFileSync(vitestPkgPath, 'utf8'));
const vitestBin = resolve(dirname(vitestPkgPath), vitestPkg.bin.vitest);

const child = spawn(process.execPath, [vitestBin, ...passthrough], {
  stdio: 'inherit',
  env: { ...process.env, FAST_CHECK_VITEST_NUM_RUNS: String(numRuns) },
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
