// @ts-check
const {
  promises: { readFile, writeFile },
} = require('fs');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

/**
 * @param {string} pr
 * @param {string} title
 * @returns {string}
 */
function buildPrLine(pr, title) {
  return `([PR#${pr}](https://github.com/dubzzz/fast-check/pull/${pr})) ${title}`;
}

/**
 * Extract most recent tag in current branch
 * @returns {Promise<string>}
 */
async function extractLastTag() {
  const { stdout: lastTagOutput } = await execFile('git', ['describe', '--tags', '--abbrev=0']);
  return lastTagOutput.trim();
}

/**
 * Extract and parse the logs of git to get lines for the changelog
 * @param {string} fromIdentifier
 * @returns {Promise<{breakingSection:string[], newFeaturesSection:string[], maintenanceSection:{type:string,pr:string,title:string}[], errors: string[]}>}
 */
async function extractAndParseDiff(fromIdentifier) {
  // Extract raw diff log
  const { stdout: diffOutput } = await execFile('git', ['--no-pager', 'log', `${fromIdentifier}..HEAD`, '--format=%s']);
  const diffOutputLines = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length !== 0);

  // Parse raw diff log
  const breakingSection = [];
  const newFeaturesSection = [];
  const maintenanceSection = [];
  const errors = [];
  for (const lineDiff of diffOutputLines) {
    const [type, ...titleAndPR] = lineDiff.split(' ');
    const prExtractor = /^(.*) \(#(\d+)\)$/;
    let title;
    let pr;
    try {
      [, title, pr] = prExtractor.exec(titleAndPR.join(' '));
    } catch (err) {
      errors.push(`Failed to extract PR/title from: ${JSON.stringify(lineDiff)}`);
      break;
    }
    switch (type) {
      case '💥':
      case ':boom:':
        breakingSection.push(buildPrLine(pr, title));
        break;
      case '⚡️':
      case ':zap:':
      case '✨':
      case ':sparkles:':
      case '🗑️':
      case ':wastebasket:':
      case '🏷️':
      case ':label:':
        newFeaturesSection.push(buildPrLine(pr, title));
        break;
      case '🔥':
      case ':fire:':
        maintenanceSection.push({ type: 'Clean', pr, title });
        break;
      case '🐛':
      case ':bug:':
        maintenanceSection.push({ type: 'Bug', pr, title });
        break;
      case '📝':
      case ':memo:':
        maintenanceSection.push({ type: 'Doc', pr, title });
        break;
      case '✏️':
      case ':pencil2:':
        maintenanceSection.push({ type: 'Typo', pr, title });
        break;
      case '✅':
      case ':white_check_mark:':
        maintenanceSection.push({ type: 'Test', pr, title });
        break;
      case '⬆️':
      case ':arrow_up:':
        break;
      case '♻️':
      case ':recycle:':
        maintenanceSection.push({ type: 'Refactor', pr, title });
        break;
      case '💚':
      case ':green_heart:':
      case '👷':
      case ':construction_worker:':
      case '🔧':
      case ':wrench:':
        maintenanceSection.push({ type: 'CI', pr, title });
        break;
      case '🔨':
      case ':hammer:':
        maintenanceSection.push({ type: 'Script', pr, title });
        break;
      case '🚚':
      case ':truck:':
        maintenanceSection.push({ type: 'Move', pr, title });
        break;
      default:
        errors.push(`Unhandled type: ${type} on PR-${pr} with title ${title}`);
        break;
    }
  }

  return { breakingSection, newFeaturesSection, maintenanceSection, errors };
}

/**
 * Extract and parse the logs of git to get lines for the changelog
 * @param {string} tagName
 * @returns {{major:string,minor:string,patch:string}}
 */
function extractMajorMinorPatch(tagName) {
  const [major, minor, patch] = tagName.split('v')[1].split('.');
  return { major, minor, patch };
}

/**
 * Extract the kind of release
 * @param {string} oldTagName
 * @param {string} newTagName
 * @returns {'major'|'minor'|'patch'}
 */
function extractReleaseKind(oldTagName, newTagName) {
  const oldTagVersion = extractMajorMinorPatch(oldTagName);
  const newTagVersion = extractMajorMinorPatch(newTagName);
  const releaseKind =
    newTagVersion.major !== oldTagVersion.major
      ? 'major'
      : newTagVersion.minor !== oldTagVersion.minor
      ? 'minor'
      : 'patch';
  return releaseKind;
}

/**
 * @param {{shortDescription:string}} configuration
 * @returns {Promise<{branchName:string, commitName:string, errors:string[]}>}
 */
async function run({ shortDescription }) {
  // Get next version via yarn
  const { stdout: yarnOut } = await execFile('yarn', ['version', 'apply', '--all', '--dry-run', '--json']);
  let nextVersion = '0.0.0';
  for (const line of yarnOut.split('\n')) {
    try {
      const details = JSON.parse(line);
      if (details.ident === 'fast-check') {
        nextVersion = details.newVersion;
        break;
      }
    } catch (err) {}
  }

  // Extract metas for changelog
  const lastTag = await extractLastTag();
  const nextTag = `v${nextVersion}`;
  const releaseKind = extractReleaseKind(lastTag, nextTag);
  const { breakingSection, newFeaturesSection, maintenanceSection, errors } = await extractAndParseDiff(lastTag);

  // Build changelog message
  const codeUrl = `https://github.com/dubzzz/fast-check/tree/${nextTag}`;
  const diffUrl = `https://github.com/dubzzz/fast-check/compare/${lastTag}...${nextTag}`;
  const breakingBlock = breakingSection
    .reverse()
    .map((line) => `- ${line}`)
    .join('\n');
  const newFeaturesBlock = newFeaturesSection
    .reverse()
    .map((line) => `- ${line}`)
    .join('\n');
  const maintenanceBlock = maintenanceSection
    .reverse()
    .sort((a, b) => a.type.localeCompare(b.type))
    .map(({ type, title, pr }) => `- ${buildPrLine(pr, `${type}: ${title}`)}`)
    .join('\n');
  const body =
    `# ${nextVersion}\n\n` +
    `_${shortDescription}_\n` +
    `[[Code](${codeUrl})][[Diff](${diffUrl})]\n\n` +
    (breakingBlock.length !== 0 ? '## Breaking changes\n\n' + `${breakingBlock}\n\n` : '') +
    '## Features\n\n' +
    `${newFeaturesBlock}\n\n` +
    '## Fixes\n\n' +
    `${maintenanceBlock}`;

  // Report in console
  console.log(`Changelog is:\n\n${body}\n\n---`);
  if (errors.length > 0) {
    console.log(`Got errors:\n${errors.join('\n')}`);
  }

  // Update changelog
  const changelogFilename = './CHANGELOG.md';
  const previousContent = await readFile(changelogFilename);
  await writeFile(changelogFilename, `${body}\n\n${releaseKind !== 'patch' ? `---\n\n` : ''}${previousContent}`);
  await execFile('git', ['add', changelogFilename]);

  // Update package.json
  await execFile('yarn', ['version', 'apply', '--all']);
  await execFile('git', ['add', 'packages/fast-check/package.json']);

  // Create another branch and commit on it
  const branchName = `changelog-${nextVersion.replace(/\./g, '-')}-${Math.random().toString(16).substring(2)}`;
  const commitName = `🔖 Update CHANGELOG.md for ${nextVersion}`;
  await execFile('git', ['checkout', '-b', branchName]);
  await execFile('git', ['commit', '-m', commitName]);
  await execFile('git', ['push', '--set-upstream', 'origin', branchName]);

  // Return useful details
  return { branchName, commitName, errors };
}

exports.run = run;
