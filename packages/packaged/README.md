# `@fast-check/packaged`

Utility package removing any files that will not be part of the final bundle published to npm registry

<a href="https://badge.fury.io/js/@fast-check%2Fpackaged"><img src="https://badge.fury.io/js/@fast-check%2Fpackaged.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/packaged"><img src="https://img.shields.io/npm/dm/@fast-check%2Fpackaged" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fpackaged.svg" alt="License" /></a>

---

## Why?

When publishing packages to npm registry, it is quite easy to forget about some files. It also happens many times that we want somehow to check the packaged bundle in some of our tests but totally forget that some files have not been added to the bundle and so that the final user will actually never be able to run this code.

This package mostly try to prevent this issue. It can easily be used in monorepos to emulate the bundled package when used against other packages of the monorepo to make sure others do not depend on internals or non published stuff.

## Easy to use

Run the following command at the root of your package to drop any file that will not make it in the final bundle published to npm.

```bash
# With npm
npx -p @fast-check/packaged packaged
# With yarn
yarn dlx -p @fast-check/packaged packaged
```

⚠️ You may want to try with `--dry-run` flag first to give it a try.

It also comes with some extra flags:

- `--dry-run`: do not drop any file or directory from the file system and only print what would have been removed
- `--keep-node-modules`: keep the `node_modules` directory if any at the root of the directory

## Simple API

```js
import { computePublishedFiles, removeNonPublishedFiles } from '@fast-check/packaged';

// Compute the list of all files that would be part of the bundle
// if we attempted to publish the packge defined at .
const publishedFilesRoot = await computePublishedFiles('.');

// Compute the list of all files that would be part of the bundle
// if we attempted to publish the packge defined at ./sub-directory
const publishedFilesSubDirectory = await computePublishedFiles('./sub-directory');

// Run the deletion of unwanted files
const { kept, removed } = await removeNonPublishedFiles('.', { dryRun: false, keepNodeModules: false });
// kept and removed are arrays of strings
// they may contain files or directories
```

## Minimal requirements

- Node ≥14.14.0
