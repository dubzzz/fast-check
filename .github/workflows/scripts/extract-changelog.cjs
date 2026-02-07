// @ts-check
const { readFileSync } = require('fs');
const path = require('path');

/**
 * Extract the changelog for the latest version of fast-check.
 * Scans the CHANGELOG.md file line by line until finding the start of another release note.
 * @returns {{version: string, changelog: string}}
 */
function extractLatestChangelog() {
  const changelogPath = path.join(process.env.GITHUB_WORKSPACE || process.cwd(), 'packages', 'fast-check', 'CHANGELOG.md');
  const content = readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');

  let version = '';
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
      changelogLines.push(line);
    }
  }

  // Trim trailing empty lines
  while (changelogLines.length > 0 && changelogLines[changelogLines.length - 1].trim() === '') {
    changelogLines.pop();
  }

  return { version, changelog: changelogLines.join('\n') };
}

exports.extractLatestChangelog = extractLatestChangelog;
