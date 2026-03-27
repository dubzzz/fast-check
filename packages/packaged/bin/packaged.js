#!/usr/bin/env node

import { removeNonPublishedFiles } from '../lib/packaged.js';

function run(args) {
  const help = args.includes('--help') || args.includes('-h');
  if (help) {
    console.log('Usages:');
    console.log('- packaged');
    console.log('  Drop any file in the current directory that will not be part of the package');
    console.log('  if published to npm registry');
    console.log('- packaged --dry-run');
    console.log('  No removal, just printing');
    console.log('- packaged --keep <glob>');
    console.log('  Keep files/directories matching the glob pattern (can be specified multiple times)');
    return;
  }
  let dryRun = false;
  const keep = [];
  for (let i = 0; i < args.length; ++i) {
    if (args[i] === '--keep') {
      if (i + 1 >= args.length) {
        throw new Error('Missing value for --keep');
      }
      keep.push(args[i + 1]);
      ++i;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else {
      throw new Error(`Unknown flag: ${args[i]}`);
    }
  }
  removeNonPublishedFiles('.', { dryRun, keep }).then(
    (out) => {
      if (dryRun) {
        console.log('Those files would have been kept:');
        for (const k of out.kept) {
          console.log(`- ${k}`);
        }
        console.log('Those files would have been removed:');
        for (const r of out.removed) {
          console.log(`- ${r}`);
        }
      }
    },
    (error) => {
      console.error('Process aborted! An error occurred when removing non-published files:');
      console.error('----------');
      console.error(error);
      console.error('----------');
      process.exit(1);
    },
  );
}

run(process.argv.slice(2));
