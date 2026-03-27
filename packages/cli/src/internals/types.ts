export type Framework = 'vitest' | 'jest' | 'ava';

export interface DetectedSetup {
  framework: Framework;
  frameworkVersion: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

export interface SetupResult {
  extensionInstalled: string;
  timeoutConfigured: boolean;
  configPath: string | undefined;
}
