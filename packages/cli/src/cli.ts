import { detectFramework } from './internals/detectFramework.js';
import { installExtension } from './internals/installExtension.js';
import { configureTimeout, frameworkConfigHint } from './internals/configureTimeout.js';

export async function run(args: string[]): Promise<number> {
  const help = args.includes('--help') || args.includes('-h');
  if (help) {
    printHelp();
    return 0;
  }

  const dryRun = args.includes('--dry-run');
  const cwd = process.cwd();

  console.log('Detecting test framework...');
  const setup = await detectFramework(cwd);
  if (setup === undefined) {
    console.error('Could not detect a supported test framework (vitest, jest, or ava).');
    console.error('Make sure you have one of them listed in your package.json dependencies.');
    return 1;
  }

  console.log(`Found ${setup.framework} (${setup.frameworkVersion}) with ${setup.packageManager}.`);

  if (dryRun) {
    console.log('[dry-run] Would install @fast-check/' + setup.framework);
    console.log('[dry-run] Would create setup file for timeout configuration');
    return 0;
  }

  // Step 1: Install the right extension
  const extension = await installExtension(setup, cwd);
  console.log(`Installed ${extension}.`);

  // Step 2: Configure timeout setup file
  const { configPath, created } = await configureTimeout(setup.framework, cwd);
  if (created) {
    console.log(`Created ${configPath} with interruptAfterTimeLimit configuration.`);
    console.log('');
    console.log(frameworkConfigHint(setup.framework, configPath));
  } else {
    console.log(`Setup file ${configPath} already exists, skipping.`);
  }

  console.log('');
  console.log('fast-check is ready to use!');
  return 0;
}

function printHelp(): void {
  console.log('Usage: @fast-check/cli [options]');
  console.log('');
  console.log('Setup fast-check within your project:');
  console.log('  - Detects your test framework (vitest, jest, ava)');
  console.log('  - Installs the matching @fast-check extension');
  console.log('  - Creates a setup file to prevent timeout breaches');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run   Show what would be done without making changes');
  console.log('  --help, -h  Show this help message');
}
