#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');

const [transform, ...args] = process.argv.slice(2);
const usage = 'Usage: fast-check-codemod v5/no-asyncProperty <path> [jscodeshift options]';

if (transform === '--help' || transform === '-h') {
  console.log(usage);
} else if (transform !== 'v5/no-asyncProperty' || args.length === 0 || args[0].startsWith('-')) {
  console.error(usage);
  process.exitCode = 1;
} else if (!existsSync(args[0])) {
  console.error(`Path does not exist: ${args[0]}`);
  process.exitCode = 1;
} else {
  const result = spawnSync(
    process.execPath,
    [
      require.resolve('jscodeshift/bin/jscodeshift.js'),
      '--transform',
      require.resolve('../transforms/v5/no-asyncProperty.cjs'),
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
