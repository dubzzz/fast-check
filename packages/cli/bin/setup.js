#!/usr/bin/env node

import { run } from '../lib/cli.js';

run(process.argv.slice(2)).then(
  (code) => {
    process.exit(code);
  },
  (error) => {
    console.error('Setup failed with an unexpected error:');
    console.error(error);
    process.exit(1);
  },
);
