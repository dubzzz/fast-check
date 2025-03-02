import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { replaceInFileSync } from 'replace-in-file';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Append *.js file extension on all local imports

const options = {
  files: ['lib/**/*.js', 'lib/**/*.d.ts'],
  from: [/from '\.(.*)(?<!\.js)'/g, /from "\.(.*)(?<!\.js)"/g],
  to: ["from '.$1.js'", 'from ".$1.js"'],
};

const results = replaceInFileSync(options);
for (const { file, hasChanged } of results) {
  if (hasChanged) {
    console.info(`Extensions added to: ${file}`);
  }
}

// Fill metas related to the package

// eslint-disable-next-line
const commitHash = getCommitHash();

fs.readFile(path.join(__dirname, '../package.json'), (err, data) => {
  if (err) {
    console.error(err.message);
    process.exit(2);
  }

  const packageVersion = JSON.parse(data.toString()).version;

  const commonJsReplacement = replaceInFileSync({
    files: 'lib/cjs/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['commonjs', packageVersion, commitHash],
  });
  if (commonJsReplacement.length === 1 && commonJsReplacement[0].hasChanged) {
    console.info(`Package details added onto commonjs version`);
  }

  const moduleReplacement = replaceInFileSync({
    files: 'lib/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['module', packageVersion, commitHash],
  });
  if (moduleReplacement.length === 1 && moduleReplacement[0].hasChanged) {
    console.info(`Package details added onto module version`);
  }

  const dTsReplacement = replaceInFileSync({
    files: 'lib/cjs/types/fast-check-default.d.ts',
    from: [/__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: [packageVersion, commitHash],
  });
  if (dTsReplacement.length === 1 && dTsReplacement[0].hasChanged) {
    console.info(`Package details added onto d.ts version for cjs`);
  }

  const dTsReplacement2 = replaceInFileSync({
    files: 'lib/types/fast-check-default.d.ts',
    from: [/__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: [packageVersion, commitHash],
  });
  if (dTsReplacement2.length === 1 && dTsReplacement2[0].hasChanged) {
    console.info(`Package details added onto d.ts version for esm`);
  }

  function reportArrayReplace(results) {
    for (const result of results.filter((x) => x.hasChanged)) {
      if (result.numReplacements === 1) {
        console.info(`Stripped ${result.numReplacements} generic from typed array for `, result.file);
      } else {
        throw new Error(
          `We expected to only replace 1 generic for ${result.file}, but instead replaced ` + result.numReplacements,
        );
      }
    }
  }

  fs.cpSync('lib/types', 'lib/types57', { recursive: true });
  const dTsReplacement57 = replaceInFileSync({
    files: 'lib/types57/**/*Array.d.ts',
    from: [/Array<ArrayBuffer>>/g],
    to: ['Array>'],
    countMatches: true,
  });
  reportArrayReplace(dTsReplacement57);

  fs.cpSync('lib/cjs/types', 'lib/cjs/types57', { recursive: true });
  const dTsReplacement57cjs = replaceInFileSync({
    files: 'lib/cjs/types57/**/*Array.d.ts',
    from: [/Array<ArrayBuffer>>/g],
    to: ['Array>'],
    countMatches: true,
  });
  reportArrayReplace(dTsReplacement57cjs);

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  const docReplacement = replaceInFileSync({
    files: 'docs/index.html',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: [escapeHtml('module'), escapeHtml(packageVersion), escapeHtml(commitHash)],
  });
  if (docReplacement.length === 1 && docReplacement[0].hasChanged) {
    console.info(`Package details added onto doc`);
  }
});

// Helpers
function getCommitHash() {
  const gitHubCommitHash = process.env.GITHUB_SHA && process.env.GITHUB_SHA.split('\n')[0];
  if (gitHubCommitHash) {
    console.info(`Using env variable GITHUB_SHA for the commit hash, got: ${gitHubCommitHash}`);
    return gitHubCommitHash;
  }
  if (process.env.EXPECT_GITHUB_SHA) {
    if (!gitHubCommitHash) {
      console.error('No GITHUB_SHA specified');
      process.exit(1);
    }
  }
  const out = execSync('git rev-parse HEAD');
  return out.toString().split('\n')[0];
}
