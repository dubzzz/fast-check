import * as path from 'path';
import { promisify } from 'util';
import { execFile as _execFile } from 'child_process';
import { describe, expect, it } from 'vitest';

const execFile = promisify(_execFile);
const avaPackageRoot = path.join(import.meta.dirname, '..');

describe('ava', () => {
  it('should pass', async () => {
    const { stdout: specOutput } = await execFile(
      'node',
      ['./node_modules/ava/entrypoints/cli.mjs', '--config', 'test/ava-specs/ava.config.js', '-s', '-t'],
      { cwd: avaPackageRoot },
    ).catch((err) => err);
    const expectedContentLines = [
      /ok \d+ - should never be executed \(with seed=48\) # SKIP/,
      /ok \d+ - should run first/,
      /ok \d+ - should run after/,
      /ok \d+ - should run serially/,
      /ok \d+ - should pass on no-failed asserts synchronous property/,
      /ok \d+ - should pass on no-failed asserts asynchronous property/,
      /not ok \d+ - should fail on failing asserts synchronous property/,
      /not ok \d+ - should fail on failing asserts asynchronous property/,
      /not ok \d+ - should fail on synchronous property not running any assertions even if returning undefined/,
      /not ok \d+ - should fail on asynchronous property not running any assertions even if returning undefined/,
      /not ok \d+ - should fail on synchronous property not running any assertions even if returning true/,
      /not ok \d+ - should fail on asynchronous property not running any assertions even if returning true/,
      /not ok \d+ - should fail on synchronous property not running any assertions returning false/,
      /not ok \d+ - should fail on asynchronous property not running any assertions returning false/,
      /ok \d+ - should pass on synchronous properties having only successful assertions even if returning false/,
      /ok \d+ - should pass on asynchronous properties having only successful assertions even if returning false/,
      /ok \d+ - should pass on property returning passing Observable/,
      /not ok \d+ - should fail on property returning failing Observable/,
      /not ok \d+ - should fail with seed=4242 and path="25" \(with seed=4242\)/,
      /ok \d+ - should pass on followed plan/,
      /not ok \d+ - should fail on not followed plan/,
      /ok \d+ - should pass kitchen sink/,
      /not ok \d+ - should fail kitchen sink/,
      /ok \d+ - should ignore the result when fc.pre interrupted the execution on synchronous properties/,
      /ok \d+ - should ignore the result when fc.pre interrupted the execution on asynchronous properties/,
      /ok \d+ - should ignore the result when fc.pre interrupted the execution on properties backed by Observables/,
      /ok \d+ - should pass as the property fails/,
      /not ok \d+ - should fail as the property passes/,
    ];
    for (const expectedContentLine of expectedContentLines) {
      expect(specOutput).toMatch(expectedContentLine);
    }
  });
});
