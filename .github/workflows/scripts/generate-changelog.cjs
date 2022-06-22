// @ts-check
const {
  promises: { readFile, writeFile },
} = require('fs');
const path = require('path');
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
 * Extract and parse the logs of git to get lines for the changelog
 * @param {string} fromIdentifier
 * @returns {Promise<{breakingSection:string[], newFeaturesSection:string[], maintenanceSection:{type:string,pr:string,title:string}[], errors: string[]}>}
 */
async function extractAndParseDiff(fromIdentifier) {
  const breakingSection = [];
  const newFeaturesSection = [];
  const maintenanceSection = [];
  const errors = [];
  if (isInitialTag(fromIdentifier)) {
    return { breakingSection, newFeaturesSection, maintenanceSection, errors };
  }

  // Extract raw diff log
  const { stdout: diffOutput } = await execFile('git', ['--no-pager', 'log', `${fromIdentifier}..HEAD`, '--format=%s']);
  const diffOutputLines = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length !== 0);

  // Parse raw diff log
  for (const lineDiff of diffOutputLines) {
    const [type, ...titleAndPR] = lineDiff.split(' ');
    const prExtractor = /^(.*) \(#(\d+)\)$/;
    const m = prExtractor.exec(titleAndPR.join(' '));
    if (!m) {
      errors.push(`Failed to extract PR/title from: ${JSON.stringify(lineDiff)}`);
      break;
    }
    const [, title, pr] = m;
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
 * Compute tag from version
 * @param {string} versionName
 * @param {string} packageName
 * @returns {string}
 */
function computeTag(versionName, packageName) {
  if (packageName === 'fast-check') {
    return `v${versionName}`;
  }
  return `${packageName.split('/')[1]}/v${versionName}`;
}

/**
 * Check if tag corresponds to v0
 * @param {string} tagName
 * @returns {boolean}
 */
function isInitialTag(tagName) {
  return tagName.endsWith('v0.0.0');
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
 * @returns {Promise<{branchName:string, commitName:string, errors:string[]}>}
 */
async function run() {
  const allErrors = [];

  // Get packages to be bumped via yarn
  const { stdout: yarnOut } = await execFile('yarn', ['version', 'apply', '--all', '--dry-run', '--json']);
  const allBumps = yarnOut
    .split('\n')
    .filter((line) => line.trim().length !== 0)
    .map((line) => JSON.parse(line));

  for (const packageBump of allBumps) {
    const { oldVersion, newVersion, cwd: packageLocation, ident: packageName } = packageBump;

    // Extract metas for changelog
    const oldTag = computeTag(oldVersion, packageName);
    const newTag = computeTag(newVersion, packageName);
    const releaseKind = extractReleaseKind(oldTag, newTag);
    const { breakingSection, newFeaturesSection, maintenanceSection, errors } = await extractAndParseDiff(oldTag);

    // Build changelog message
    const codeUrl = `https://github.com/dubzzz/fast-check/tree/${encodeURIComponent(newTag)}`;
    const diffUrl = `https://github.com/dubzzz/fast-check/compare/${encodeURIComponent(oldTag)}...${encodeURIComponent(
      newTag
    )}`;
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
      `# ${newVersion}\n\n` +
      `_TODO Description_\n` +
      `[[Code](${codeUrl})]${!isInitialTag(oldTag) ? `[[Diff](${diffUrl})]` : ''}\n\n` +
      (breakingBlock.length !== 0 ? '## Breaking changes\n\n' + `${breakingBlock}\n\n` : '') +
      '## Features\n\n' +
      `${newFeaturesBlock}\n\n` +
      '## Fixes\n\n' +
      `${maintenanceBlock}`;

    // Report in console
    console.log(`Changelog for ${packageName} is:\n\n${body}\n\n---`);
    if (errors.length > 0) {
      allErrors.push(...errors);
      console.log(`Got errors:\n${errors.join('\n')}`);
    }

    // Update changelog
    const changelogPath = path.join(packageLocation, 'CHANGELOG.md');
    const previousContent = await readFile(changelogPath);
    await writeFile(changelogPath, `${body}\n\n${releaseKind !== 'patch' ? `---\n\n` : ''}${previousContent}`);
    await execFile('git', ['add', changelogPath]);
  }

  // Update all needed package.json
  await execFile('yarn', ['version', 'apply', '--all']);
  await execFile('git', ['add', './**/package.json']);

  // Create another branch and commit on it
  const branchName = `changelog-${Math.random().toString(16).substring(2)}`;
  const commitName = `🔖 Update CHANGELOG.md for ${allBumps.map((b) => `${b.ident}@${b.newVersion}`).join(', ')}`;
  await execFile('git', ['checkout', '-b', branchName]);
  await execFile('git', ['commit', '-m', commitName]);
  await execFile('git', ['push', '--set-upstream', 'origin', branchName]);

  // Return useful details
  return { branchName, commitName, errors: allErrors };
}

exports.run = run;
