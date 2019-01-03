// @ts-check
const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * @param {string} fileDir
 * @returns {void}
 */
const mkdirRec = fileDir => {
  if (fs.existsSync(fileDir)) return;

  const parentDir = path.dirname(fileDir);
  if (parentDir.length === 0) return;

  mkdirRec(parentDir);
  fs.mkdirSync(fileDir);
};

/**
 * @param {string} toLabel
 * @param {((ctn: string) => string)[]} transformations
 * @returns {void}
 */
const rewriteTypesTo = (toLabel, transformations) => {
  glob('lib/types/**/*.d.ts', {}, function(err, files) {
    for (const f of files) {
      const newFileName = f.replace('/types/', '/' + toLabel + '/');
      const directoryPath = path.dirname(newFileName);
      mkdirRec(directoryPath);
      const originalContent = fs.readFileSync(f).toString();
      let content = originalContent;
      for (const t of transformations) {
        content = t(content);
      }
      fs.writeFileSync(newFileName, content);
    }
  });
};

/**
 * @param {string} content
 * @returns {string}
 */
const bigintToAny = content => {
  return content.replace(/([^\w\d]|^)bigint([^\w\d]|$)/g, '$1any$2');
};

rewriteTypesTo('ts3.2', []);
rewriteTypesTo('types', [bigintToAny]);
