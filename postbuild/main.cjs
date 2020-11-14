// eslint-disable-next-line
const fs = require('fs');
// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const process = require('process');
// eslint-disable-next-line
const replace = require('replace-in-file');

// Append *.js file extension on all local imports

const options = {
  files: 'lib/**/*.js',
  from: [/from '\.(.*)(?<!\.js)'/g, /from "\.(.*)(?<!\.js)"/g],
  to: ["from '.$1.js'", 'from ".$1.js"'],
};

const results = replace.sync(options);
for (const { file, hasChanged } of results) {
  if (hasChanged) {
    // eslint-disable-next-line
    console.info(`Extensions added to: ${file}`);
  }
}

// Fill metas related to the package

const commitHash = process.env.COMMIT_HASH && process.env.COMMIT_HASH.split('\n')[0];
if (!commitHash) {
  // eslint-disable-next-line
  console.error('No COMMIT_HASH specified (env), please use: `COMMIT_HASH=$(git rev-parse HEAD)` to set it');
  process.exit(1);
}

// eslint-disable-next-line
fs.readFile(path.join(__dirname, '../package.json'), (err, data) => {
  if (err) {
    // eslint-disable-next-line
    console.error(err.message);
    process.exit(2);
  }

  const packageVersion = JSON.parse(data.toString()).version;

  const commonJsReplacement = replace.sync({
    files: 'lib/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['commonjs', packageVersion, commitHash],
  });
  if (commonJsReplacement.length === 1 && commonJsReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto commonjs version`);
  }

  const moduleReplacement = replace.sync({
    files: 'lib/esm/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['module', packageVersion, commitHash],
  });
  if (moduleReplacement.length === 1 && moduleReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto module version`);
  }

  const dTsReplacement = replace.sync({
    files: 'lib/types/fast-check-default.d.ts',
    from: [/__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: [packageVersion, commitHash],
  });
  if (dTsReplacement.length === 1 && dTsReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto d.ts version`);
  }
});
