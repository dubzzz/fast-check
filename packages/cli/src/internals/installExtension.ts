import { execFile } from 'node:child_process';
import type { DetectedSetup } from './types.js';

const extensionForFramework: Record<string, string> = {
  vitest: '@fast-check/vitest',
  jest: '@fast-check/jest',
  ava: '@fast-check/ava',
};

function installCommand(packageManager: string): [cmd: string, args: string[]] {
  switch (packageManager) {
    case 'pnpm':
      return ['pnpm', ['add', '-D']];
    case 'yarn':
      return ['yarn', ['add', '-D']];
    default:
      return ['npm', ['install', '-D']];
  }
}

function exec(cmd: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function installExtension(setup: DetectedSetup, cwd: string): Promise<string> {
  const extension = extensionForFramework[setup.framework];
  if (extension === undefined) {
    throw new Error(`No fast-check extension available for framework: ${setup.framework}`);
  }

  const [cmd, args] = installCommand(setup.packageManager);
  console.log(`Installing ${extension} using ${setup.packageManager}...`);
  await exec(cmd, [...args, extension], cwd);

  return extension;
}
