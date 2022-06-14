import * as fs from 'fs/promises';
import { tarball } from 'pacote';
import * as path from 'path';
import { list } from 'tar';

/**
 * Compute the list of all files that will be part of the package if published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function computePublishedFiles(packageRoot: string): Promise<string[]> {
  const publishedFiles: string[] = [];
  const tarBuffer = await tarball(`file:${packageRoot}`, { dryRun: true });
  const stream = list({
    onentry: (entry) => {
      const entryPath: string = entry.path as any;
      publishedFiles.push(entryPath.substring(8)); // dropping 'package/'
    },
  });
  stream.end(tarBuffer);
  return publishedFiles;
}

/**
 * Remove from the filesystem any file that will not be published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function removeNonPublishedFiles(
  packageRoot: string,
  opts: { dryRun?: boolean; keepNodeModules?: boolean } = {}
): Promise<{ kept: string[]; removed: string[] }> {
  const kept: string[] = [];
  const removed: string[] = [];
  const publishedFiles = await computePublishedFiles(packageRoot);
  const normalizedPublishedFiles = new Set(
    publishedFiles.map((filename) => path.normalize(path.join(packageRoot, filename)))
  );

  const rootNodeModulesPath = path.join(packageRoot, 'node_modules');

  async function traverse(currentPath: string): Promise<boolean> {
    const content = await fs.readdir(currentPath);
    let numRemoved = 0;
    await Promise.all(
      content.map(async (itemName) => {
        const itemPath = path.join(currentPath, itemName);
        const normalizedItemPath = path.normalize(itemPath);
        const itemDetails = await fs.stat(itemPath);
        if (opts.keepNodeModules && itemPath === rootNodeModulesPath) {
          kept.push(normalizedItemPath);
        } else if (itemDetails.isDirectory()) {
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
        } else if (itemDetails.isFile()) {
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
      })
    );
    return content.length === numRemoved;
  }
  await traverse(packageRoot);
  return { kept, removed };
}
