import { execFile as execFileCallback } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, it } from 'vitest';

const execFile = promisify(execFileCallback);

describe('@fast-check/worker', () => {
  it('should support worker properties with published fast-check v4', async () => {
    await execFile(
      process.execPath,
      [
        '--import',
        fileURLToPath(new URL('./__test-helpers__/FastCheckV4.mjs', import.meta.url)),
        fileURLToPath(new URL('./__properties__/legacyCompatibility.mjs', import.meta.url)),
      ],
      { timeout: 20000 },
    );
  });
});
