/* global process, console, require */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { removeNonPublishedFiles } = require('../lib/packaged.js');

const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');
if (help) {
  console.log('Usages:');
  console.log('- packaged');
  console.log('  Drop any file in the current directory that will not be part of the package');
  console.log('  if published to npm registry');
  console.log('- packaged --dry-run');
  console.log('  No removal, just printing');
  console.log('- packaged --keep-node-modules');
  console.log('  Keep root level node_modules if any');
  return;
}
const dryRun = args.includes('--dry-run');
const keepNodeModules = args.includes('--keep-node-modules');
removeNonPublishedFiles('.', { dryRun, keepNodeModules }).then((out) => {
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
});
