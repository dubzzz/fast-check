// @ts-check
const { readFileSync } = require('fs');
const path = require('path');

/**
 * Compute the git tag name for a given version.
 * fast-check uses `v<version>`, other packages use `<packageDir>/v<version>`.
 * @param {string} packageDir - Sub-directory name under packages/ (e.g. 'fast-check', 'ava', 'jest')
 * @param {string} version - Version string (e.g. '4.5.3')
 * @returns {string}
 */
function computeTagName(packageDir, version) {
  if (packageDir === 'fast-check') {
    return `v${version}`;
  }
  return `${packageDir}/v${version}`;
}

/**
 * Extract the changelog for the latest version of a package.
 * Scans the CHANGELOG.md file line by line until finding the start of another release note.
 * @param {string} packageDir - Sub-directory name under packages/ (e.g. 'fast-check', 'ava', 'jest')
 * @returns {{version: string, tag: string, releaseName: string, changelog: string}}
 */
function extractLatestChangelog(packageDir) {
  const changelogPath = path.join(__dirname, '..', '..', '..', 'packages', packageDir, 'CHANGELOG.md');
  const content = readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');

  let version = '';
  let releaseName = '';
  const changelogLines = [];
  let foundFirst = false;

  for (const line of lines) {
    if (/^# /.test(line)) {
      if (foundFirst === true) {
        break;
      }
      foundFirst = true;
      version = line.replace(/^# /, '').trim();
      continue;
    }
    if (foundFirst === true) {
      const releaseNameMatch = line.match(/^_(.+)_$/);
      if (releaseNameMatch !== null && releaseName === '') {
        releaseName = releaseNameMatch[1];
      } else {
        changelogLines.push(line);
      }
    }
  }

  // Trim trailing empty lines
  while (changelogLines.length > 0 && changelogLines[changelogLines.length - 1].trim() === '') {
    changelogLines.pop();
  }

  const tag = computeTagName(packageDir, version);
  return { version, tag, releaseName, changelog: changelogLines.join('\n') };
}

exports.extractLatestChangelog = extractLatestChangelog;
