import { promises as fs } from 'fs';
import packlist from 'npm-packlist';
import { Arborist } from '@npmcli/arborist';
import * as path from 'path';

/**
 * Compute the list of all files that will be part of the package if published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function computePublishedFiles(packageRoot: string): Promise<string[]> {
  const arborist = new Arborist({ path: packageRoot });
  const tree = await arborist.loadActual();
  const files = await packlist(tree);
  return files;
}

/**
 * @returns true if add was successful
 * @internal
 */
function tryAdd<T>(set: Set<T>, value: T): boolean {
  const sizeBefore = set.size;
  set.add(value);
  return set.size !== sizeBefore;
}

/** @internal */
function buildNormalizedPublishedDirectoriesSet(normalizedPublishedFiles: string[]): Set<string> {
  const normalizedPublishedDirectoriesSet = new Set<string>();

  // Scanning published files one by one to add our their directories as "directories to be preserved/published"
  for (const filePath of normalizedPublishedFiles) {
    // Dropping one directory at a time from the path until we already know about thi precise directory to stop the scan earlier
    let directory = path.dirname(filePath); // already normalized
    while (directory !== '' && tryAdd(normalizedPublishedDirectoriesSet, directory)) {
      const lastSep = directory.lastIndexOf(path.sep);
      if (lastSep === -1) {
        break;
      }
      directory = directory.substring(0, lastSep);
    }
  }
  return normalizedPublishedDirectoriesSet;
}

/**
 * Traverse all files starting from children of currentPath and drop any file or directory not belonging
 * to the set of published elements.
 * @internal
 */
async function traverseAndRemoveNonPublishedFiles(
  currentPath: string,
  out: { kept: string[]; removed: string[] },
  opts: {
    rootNodeModulesPath: string | undefined;
    dryRun: boolean;
    publishedDirectories: Set<string>;
    publishedFiles: Set<string>;
  },
): Promise<void> {
  const awaitedTasks: Promise<unknown>[] = [];
  const content = await fs.readdir(currentPath);
  for (const itemName of content) {
    const itemPath = path.join(currentPath, itemName);
    if (itemPath === opts.rootNodeModulesPath) {
      out.kept.push(itemPath);
    } else if (opts.publishedDirectories.has(itemPath)) {
      out.kept.push(itemPath);
      awaitedTasks.push(traverseAndRemoveNonPublishedFiles(itemPath, out, opts));
    } else if (opts.publishedFiles.has(itemPath)) {
      out.kept.push(itemPath);
    } else {
      out.removed.push(itemPath);
      if (!opts.dryRun) {
        awaitedTasks.push(fs.rm(itemPath, { recursive: true }));
      }
    }
  }
  await Promise.all(awaitedTasks);
}

/**
 * Remove from the filesystem any file that will not be published
 * @param packageRoot - The path to the root of the package, eg.: .
 */
export async function removeNonPublishedFiles(
  packageRoot: string,
  opts: { dryRun?: boolean; keepNodeModules?: boolean } = {},
): Promise<{ kept: string[]; removed: string[] }> {
  const publishedFiles = await computePublishedFiles(packageRoot);

  const out: { kept: string[]; removed: string[] } = { kept: [], removed: [] };
  const normalizedPackageRoot = path.normalize(packageRoot);
  const normalizedPublishedFiles = publishedFiles.map((filename) => path.join(normalizedPackageRoot, filename));
  const normalizedPublishedFilesSet = new Set(normalizedPublishedFiles);
  const normalizedPublishedDirectoriesSet = buildNormalizedPublishedDirectoriesSet(normalizedPublishedFiles);
  const traverseOpts = {
    rootNodeModulesPath: opts.keepNodeModules ? path.join(normalizedPackageRoot, 'node_modules') : undefined,
    dryRun: !!opts.dryRun,
    publishedDirectories: normalizedPublishedDirectoriesSet,
    publishedFiles: normalizedPublishedFilesSet,
  };
  await traverseAndRemoveNonPublishedFiles(normalizedPackageRoot, out, traverseOpts);
  return out;
}
