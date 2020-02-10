// eslint-disable-next-line
const fs = require('fs');
// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const replace = require('replace-in-file');

// Append *.js file extension on all local imports

const options = {
  files: 'lib/**/*.js',
  from: [/from '\.(.*)(?<!\.js)'/g, /from "\.(.*)(?<!\.js)"/g],
  to: ["from '.$1.js'", 'from ".$1.js"']
};

const results = replace.sync(options);
for (const { file, hasChanged } of results) {
  if (hasChanged) {
    // eslint-disable-next-line
    console.info(`Extensions added to: ${file}`);
  }
}

// Fill metas related to the package

// eslint-disable-next-line
fs.readFile(path.join(__dirname, '../package.json'), (err, data) => {
  if (err) {
    // eslint-disable-next-line
    console.error(err.message);
    return;
  }

  const packageVersion = JSON.parse(data.toString()).version;

  const commonJsReplacement = replace.sync({
    files: 'lib/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g],
    to: ['commonjs', packageVersion]
  });
  if (commonJsReplacement.length === 1 && commonJsReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto commonjs version`);
  }

  const moduleReplacement = replace.sync({
    files: 'lib/esm/fast-check-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g],
    to: ['module', packageVersion]
  });
  if (moduleReplacement.length === 1 && moduleReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto module version`);
  }
});
