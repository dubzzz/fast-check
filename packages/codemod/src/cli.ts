#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const allTransforms = ['v5/defaultImport', 'v5/runnerPlugins', 'v5/lifecyclePlugins'];
const [transform, ...args] = process.argv.slice(2);
const usage =
  'Usage: fast-check-codemod <transform> <path> [jscodeshift options]\nwith transform being one of: ' +
  allTransforms.join(', ');

if (transform === '--help' || transform === '-h') {
  console.log(usage);
} else if (!allTransforms.includes(transform) || args.length === 0 || args[0].startsWith('-')) {
  console.error(usage);
  process.exitCode = 1;
} else if (!existsSync(args[0])) {
  console.error(`Path does not exist: ${args[0]}`);
  process.exitCode = 1;
} else {
  const extension = import.meta.url.endsWith('.ts') ? 'ts' : 'js';
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.resolve('jscodeshift/bin/jscodeshift.js')),
      '--transform',
      fileURLToPath(import.meta.resolve(`./transforms/${transform}.${extension}`)),
      '--no-babel',
      '--extensions=js,jsx,ts,tsx,mjs,cjs,mts,cts',
      '--ignore-pattern=**/node_modules/**',
      '--ignore-pattern=**/.git/**',
      '--fail-on-error',
      ...args,
    ],
    { stdio: 'inherit' },
  );
  if (result.error) {
    console.error(result.error.message);
  }
  process.exitCode = result.status ?? 1;
}
