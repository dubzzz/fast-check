// @ts-check
const { readFileSync } = require('fs');
const path = require('path');

/**
 * Extract the changelog for the latest version of a package.
 * Scans the CHANGELOG.md file line by line until finding the start of another release note.
 * @param {string} packageDir - Sub-directory name under packages/ (e.g. 'fast-check', 'ava', 'jest')
 * @returns {{version: string, releaseName: string, changelog: string}}
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
      if (foundFirst) {
        break;
      }
      foundFirst = true;
      version = line.replace(/^# /, '').trim();
      continue;
    }
    if (foundFirst) {
      const releaseNameMatch = line.match(/^_(.+)_$/);
      if (releaseNameMatch && !releaseName) {
        releaseName = releaseNameMatch[1];
      }
      changelogLines.push(line);
    }
  }

  // Trim trailing empty lines
  while (changelogLines.length > 0 && changelogLines[changelogLines.length - 1].trim() === '') {
    changelogLines.pop();
  }

  return { version, releaseName, changelog: changelogLines.join('\n') };
}

exports.extractLatestChangelog = extractLatestChangelog;
