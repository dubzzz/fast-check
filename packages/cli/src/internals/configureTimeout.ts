import { readFile, writeFile } from 'node:fs/promises';
import type { Framework } from './types.js';

interface TimeoutConfig {
  configPath: string;
  patchConfig: (existingContent: string | undefined) => string;
}

const vitestSetupContent = `// fast-check setup: configure interruptAfterTimeLimit to stay within vitest's timeout
import fc from 'fast-check';

const TEST_TIMEOUT = 5000; // default vitest timeout in ms
fc.configureGlobal({ interruptAfterTimeLimit: TEST_TIMEOUT });
`;

const jestSetupContent = `// fast-check setup: configure interruptAfterTimeLimit to stay within jest's timeout
const fc = require('fast-check');

const TEST_TIMEOUT = 5000; // default jest timeout in ms
fc.configureGlobal({ interruptAfterTimeLimit: TEST_TIMEOUT });
`;

const avaHelperContent = `// fast-check setup: configure interruptAfterTimeLimit to stay within ava's timeout
import fc from 'fast-check';

const TEST_TIMEOUT = 10000; // default ava timeout in ms
fc.configureGlobal({ interruptAfterTimeLimit: TEST_TIMEOUT });
`;

function timeoutConfigFor(framework: Framework): TimeoutConfig {
  switch (framework) {
    case 'vitest':
      return {
        configPath: 'fast-check.setup.ts',
        patchConfig: () => vitestSetupContent,
      };
    case 'jest':
      return {
        configPath: 'fast-check.setup.js',
        patchConfig: () => jestSetupContent,
      };
    case 'ava':
      return {
        configPath: 'fast-check.setup.mjs',
        patchConfig: () => avaHelperContent,
      };
  }
}

export async function configureTimeout(
  framework: Framework,
  cwd: string,
): Promise<{ configPath: string; created: boolean }> {
  const config = timeoutConfigFor(framework);
  const fullPath = `${cwd}/${config.configPath}`;

  let existing: string | undefined;
  try {
    existing = await readFile(fullPath, 'utf-8');
  } catch {
    // file does not exist yet
  }

  if (existing !== undefined) {
    return { configPath: config.configPath, created: false };
  }

  const content = config.patchConfig(existing);
  await writeFile(fullPath, content, 'utf-8');

  return { configPath: config.configPath, created: true };
}

export function frameworkConfigHint(framework: Framework, configPath: string): string {
  switch (framework) {
    case 'vitest':
      return `Add to your vitest.config.ts:\n  test: { setupFiles: ['${configPath}'] }`;
    case 'jest':
      return `Add to your jest config:\n  "setupFiles": ["${configPath}"]`;
    case 'ava':
      return `Add to your ava config in package.json:\n  "ava": { "require": ["./${configPath}"] }`;
  }
}
