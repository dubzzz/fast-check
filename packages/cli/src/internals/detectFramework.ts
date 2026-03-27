import { readFile, access } from 'node:fs/promises';
import type { DetectedSetup, Framework } from './types.js';

const frameworkPackages: Framework[] = ['vitest', 'jest', 'ava'];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function findFramework(packageJson: PackageJson): { framework: Framework; version: string } | undefined {
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const fw of frameworkPackages) {
    if (fw in allDeps) {
      return { framework: fw, version: allDeps[fw] };
    }
  }
  return undefined;
}

async function detectPackageManager(cwd: string): Promise<'npm' | 'yarn' | 'pnpm'> {
  const lockFiles: [string, 'pnpm' | 'yarn' | 'npm'][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ];
  for (const [lockFile, pm] of lockFiles) {
    try {
      await access(`${cwd}/${lockFile}`);
      return pm;
    } catch {
      // lock file not found, try next
    }
  }
  return 'npm';
}

export async function detectFramework(cwd: string): Promise<DetectedSetup | undefined> {
  let raw: string;
  try {
    raw = await readFile(`${cwd}/package.json`, 'utf-8');
  } catch {
    return undefined;
  }

  const packageJson: PackageJson = JSON.parse(raw) as PackageJson;
  const found = findFramework(packageJson);
  if (found === undefined) {
    return undefined;
  }

  const packageManager = await detectPackageManager(cwd);

  return {
    framework: found.framework,
    frameworkVersion: found.version,
    packageManager,
  };
}
