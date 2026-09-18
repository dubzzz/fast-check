import { promises as fs } from 'fs';
import { generatedTestsDirectory } from './__test-helpers__/RunJest.js';

export async function setup(): Promise<void> {
  await fs.mkdir(generatedTestsDirectory, { recursive: true });
}

export async function teardown(): Promise<void> {
  await fs.rm(generatedTestsDirectory, { recursive: true });
}
