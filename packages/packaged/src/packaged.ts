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
    while (directory !== '' && !tryAdd(normalizedPublishedDirectoriesSet, directory)) {
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
  const content = await fs.readdir(currentPath, { withFileTypes: true });
  for (const item of content) {
    const itemPath = path.join(currentPath, item.name);
    const normalizedItemPath = path.normalize(itemPath);
    if (itemPath === opts.rootNodeModulesPath) {
      out.kept.push(normalizedItemPath);
    } else if (item.isDirectory()) {
      if (opts.publishedDirectories.has(normalizedItemPath)) {
        out.kept.push(normalizedItemPath);
        awaitedTasks.push(traverseAndRemoveNonPublishedFiles(itemPath, out, opts));
      } else {
        out.removed.push(normalizedItemPath);
        if (!opts.dryRun) {
          awaitedTasks.push(fs.rm(itemPath, { recursive: true }));
        }
      }
    } else if (item.isFile()) {
      if (opts.publishedFiles.has(normalizedItemPath)) {
        out.kept.push(normalizedItemPath);
      } else {
        out.removed.push(normalizedItemPath);
        if (!opts.dryRun) {
          awaitedTasks.push(fs.rm(itemPath));
        }
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
  const normalizedPublishedFiles = publishedFiles.map((filename) => path.normalize(path.join(packageRoot, filename)));
  const normalizedPublishedFilesSet = new Set(normalizedPublishedFiles);
  const normalizedPublishedDirectoriesSet = buildNormalizedPublishedDirectoriesSet(normalizedPublishedFiles);
  const traverseOpts = {
    rootNodeModulesPath: opts.keepNodeModules ? path.join(packageRoot, 'node_modules') : undefined,
    dryRun: !!opts.dryRun,
    publishedDirectories: normalizedPublishedDirectoriesSet,
    publishedFiles: normalizedPublishedFilesSet,
  };
  await traverseAndRemoveNonPublishedFiles(packageRoot, out, traverseOpts);
  return out;
}
