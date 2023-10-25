import { promises as fs } from 'fs';
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
  const normalizedPublishedFilesSet = new Set(
    publishedFiles.map((filename) => path.normalize(path.join(packageRoot, filename))),
  );
  const normalizedPublishedDirectoriesSet = new Set(
    publishedFiles.flatMap((filePath) => {
      const directorySegments = path.normalize(filePath).split(path.sep).slice(0, -1);
      let currentAggregatedSegment = path.normalize(packageRoot);
      const directoryAggregatedSegments: string[] = [];
      for (const segment of directorySegments) {
        currentAggregatedSegment = path.join(currentAggregatedSegment, segment);
        directoryAggregatedSegments.push(currentAggregatedSegment);
      }
      return directoryAggregatedSegments;
    }),
  );

  const rootNodeModulesPath = path.join(packageRoot, 'node_modules');

  async function traverse(currentPath: string): Promise<void> {
    const content = await fs.readdir(currentPath, { withFileTypes: true });
    await Promise.all(
      content.map(async (item) => {
        const itemPath = path.join(currentPath, item.name);
        const normalizedItemPath = path.normalize(itemPath);
        if (opts.keepNodeModules && itemPath === rootNodeModulesPath) {
          kept.push(normalizedItemPath);
        } else if (item.isDirectory()) {
          if (normalizedPublishedDirectoriesSet.has(normalizedItemPath)) {
            kept.push(normalizedItemPath);
            await traverse(itemPath);
          } else {
            removed.push(normalizedItemPath);
            if (!opts.dryRun) {
              await fs.rm(itemPath, { recursive: true });
            }
          }
        } else if (item.isFile()) {
          if (normalizedPublishedFilesSet.has(normalizedItemPath)) {
            kept.push(normalizedItemPath);
          } else {
            removed.push(normalizedItemPath);
            if (!opts.dryRun) {
              await fs.rm(itemPath);
            }
          }
        }
      }),
    );
  }
  await traverse(packageRoot);
  return { kept, removed };
}
