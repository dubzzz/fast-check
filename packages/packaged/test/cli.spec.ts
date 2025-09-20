import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import * as path from 'path';
import * as url from 'url';

// @ts-expect-error --module must be higher
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const cliPath = path.join(__dirname, '..', 'bin', 'packaged.js');

describe('CLI', () => {
  it('should show help text with correct timing guidance', (done) => {
    const child = spawn('node', [cliPath, '--help'], { stdio: 'pipe' });
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('after publishing to npm registry');
      expect(output).not.toContain('if published to npm registry');
      done();
    });
  });
});