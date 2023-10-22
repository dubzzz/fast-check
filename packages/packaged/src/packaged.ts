import { promises as fs } from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import packlist from 'npm-packlist';
import { Arborist } from '@npmcli/arborist';
import * as path from 'path';

/**
 * Compute the list of all files that will be part of the package if published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function computePublishedFiles(packageRoot: string): Promise<string[]> {
  const arborist: typeof Arborist = new (Arborist as any)({ path: packageRoot });
  const tree = await arborist.loadActual();
  const files = await packlist(tree);
  return files;
}

/**
 * Remove from the filesystem any file that will not be published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function removeNonPublishedFiles(
  packageRoot: string,
  opts: { dryRun?: boolean; keepNodeModules?: boolean } = {},
): Promise<{ kept: string[]; removed: string[] }> {
  const kept: string[] = [];
  const removed: string[] = [];
  const publishedFiles = await computePublishedFiles(packageRoot);
  const normalizedPublishedFiles = new Set(
    publishedFiles.map((filename) => path.normalize(path.join(packageRoot, filename))),
  );

  const rootNodeModulesPath = path.join(packageRoot, 'node_modules');

  async function traverse(currentPath: string): Promise<boolean> {
    const content = await fs.readdir(currentPath, { withFileTypes: true });
    let numRemoved = 0;
    await Promise.all(
      content.map(async (item) => {
        const itemPath = path.join(currentPath, item.name);
        const normalizedItemPath = path.normalize(itemPath);
        if (opts.keepNodeModules && itemPath === rootNodeModulesPath) {
          kept.push(normalizedItemPath);
        } else if (item.isDirectory()) {
          const fullyCleaned = await traverse(itemPath);
          if (!fullyCleaned) {
            kept.push(normalizedItemPath);
          } else {
            ++numRemoved;
            removed.push(normalizedItemPath);
            if (!opts.dryRun) {
              await fs.rmdir(itemPath);
            }
          }
        } else if (item.isFile()) {
          if (normalizedPublishedFiles.has(normalizedItemPath)) {
            kept.push(normalizedItemPath);
          } else {
            ++numRemoved;
            removed.push(normalizedItemPath);
            if (!opts.dryRun) {
              await fs.rm(itemPath);
            }
          }
        }
      }),
    );
    return content.length === numRemoved;
  }
  await traverse(packageRoot);
  return { kept, removed };
}
