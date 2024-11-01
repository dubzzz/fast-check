// @ts-check
const {
  promises: { readFile, writeFile, rm },
  existsSync,
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
 * @param {string} packageName
 * @returns {Promise<{breakingSection:string[], newFeaturesSection:string[], maintenanceSection:{type:string,pr:string,title:string}[], errors: string[]}>}
 */
async function extractAndParseDiff(fromIdentifier, packageName) {
  const packageTypeSuffix = packageName === 'fast-check' ? '' : `(${packageName.split('/')[1]})`;
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
  let numPRs = 0;
  let numFailed = 0;
  let numIgnored = 0;
  let numSkippedBecauseUnrelated = 0;
  for (const lineDiff of diffOutputLines) {
    ++numPRs;
    console.debug(`[debug] Parsing ${lineDiff}`);
    const [type, ...titleAndPR] = lineDiff.split(' ');
    const prExtractor = /^(.*) \(#(\d+)\)$/;
    const m = prExtractor.exec(titleAndPR.join(' '));
    if (!m) {
      ++numFailed;
      console.debug(`[debug] >> failed to extract PR/title`);
      errors.push(`Failed to extract PR/title from: ${JSON.stringify(lineDiff)}`);
      continue;
    }
    const [, title, pr] = m;
    const hasAppropriateSuffix = packageTypeSuffix === '' ? !type.includes('(') : type.endsWith(packageTypeSuffix);
    if (!hasAppropriateSuffix) {
      console.debug(`[debug] >> unrelated package`);
      ++numSkippedBecauseUnrelated;
      continue;
    }
    switch (type.split('(')[0]) {
      case '💥':
      case ':boom:':
        breakingSection.push(buildPrLine(pr, title));
        break;
      case '✨':
      case ':sparkles:':
      case '🗑️':
      case ':wastebasket:':
      case '🏷️':
      case ':label:':
        newFeaturesSection.push(buildPrLine(pr, title));
        break;
      case '⚡️':
      case ':zap:':
        maintenanceSection.push({ type: 'Performance', pr, title });
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
      case '💄':
      case ':lipstick:':
      case '👥':
      case ':busts_in_silhouette:':
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
        ++numIgnored;
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
      case '🔒️':
      case ':lock:':
      case '📌':
      case ':pushpin:':
        maintenanceSection.push({ type: 'Security', pr, title });
        break;
      case '🎉':
      case ':tada:':
        ++numIgnored;
        break;
      default:
        ++numFailed;
        errors.push(
          `⚠️ Unhandled type: ${type} on [PR-${pr}](https://github.com/dubzzz/fast-check/pull/${pr}) with title ${title}`,
        );
        break;
    }
  }
  if (numSkippedBecauseUnrelated !== 0) {
    errors.push(`ℹ️ Scanned ${numPRs} PRs for ${packageName}:`);
    errors.push(`ℹ️ • accepted: ${maintenanceSection.length + newFeaturesSection.length + breakingSection.length},`);
    errors.push(`ℹ️ • skipped ignored: ${numIgnored},`);
    errors.push(`ℹ️ • skipped unrelated: ${numSkippedBecauseUnrelated},`);
    errors.push(`ℹ️ • failed: ${numFailed}`);
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
 * @returns {Promise<{branchName:string, commitName:string, errors:string[], changelogs: string[]}>}
 */
async function run() {
  const allErrors = [];

  // Get packages to be bumped via changeset
  const temporaryChangelogFile = 'changelog.json';
  await execFile('yarn', []);
  await execFile('yarn', ['changeset', 'status', `--output=${temporaryChangelogFile}`]);
  const temporaryChangelogFileContentBuffer = await readFile(temporaryChangelogFile);
  const temporaryChangelogFileContent = JSON.parse(temporaryChangelogFileContentBuffer.toString());
  await rm(temporaryChangelogFile);
  // Array of {name, type, oldVersion, newVersion, changesets}
  const allBumps = await Promise.all(
    temporaryChangelogFileContent.releases
      .filter((entry) => entry.type !== 'none')
      .map(async (entry) => {
        // Extracting the location of the package from the workspace
        const { stdout: packageLocationUnsafe } = await execFile('yarn', ['workspace', entry.name, 'exec', 'pwd']);
        const packageLocation = packageLocationUnsafe.split('\n')[0].trim();
        return { ...entry, packageLocation };
      }),
  );

  for (const { oldVersion, newVersion, name: packageName, type: releaseKind, packageLocation } of allBumps) {
    console.debug(`[debug] Checking ${packageName} between version ${oldVersion} and version ${newVersion}`);

    // Extract metas for changelog
    const oldTag = computeTag(oldVersion, packageName);
    const newTag = computeTag(newVersion, packageName);
    console.debug(`[debug] Checking ${packageName} between tag ${oldTag} and tag ${newTag}`);
    const { breakingSection, newFeaturesSection, maintenanceSection, errors } = await extractAndParseDiff(
      oldTag,
      packageName,
    );

    // Build changelog message
    const codeUrl = `https://github.com/dubzzz/fast-check/tree/${encodeURIComponent(newTag)}`;
    const diffUrl = `https://github.com/dubzzz/fast-check/compare/${encodeURIComponent(oldTag)}...${encodeURIComponent(
      newTag,
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
    const previousContent = existsSync(changelogPath) ? await readFile(changelogPath) : '';
    await writeFile(changelogPath, `${body}\n\n${releaseKind !== 'patch' ? `---\n\n` : ''}${previousContent}`);
    await execFile('git', ['add', changelogPath]);

    // Update the package.json
    await execFile('npm', ['--no-git-tag-version', '--workspaces-update=false', 'version', releaseKind], {
      cwd: packageLocation,
    });
    const packageJsonPath = path.join(packageLocation, 'package.json');
    await execFile('git', ['add', packageJsonPath]);
  }

  // Force yarn reinstall
  await execFile('yarn');
  await execFile('git', ['add', 'yarn.lock']);

  // Drop all changesets
  const alreadyDeleted = new Set();
  for (const { changesets } of allBumps) {
    for (const changeset of changesets) {
      if (alreadyDeleted.has(changeset)) {
        continue;
      }
      alreadyDeleted.add(changeset);
      await execFile('git', ['rm', `.changeset/${changeset}.md`]);
    }
  }

  // Create another branch and commit on it
  const branchName = `changelog-${Math.random().toString(16).substring(2)}`;
  const commitName = `🔖 Update CHANGELOG.md for ${allBumps.map((b) => `${b.ident}@${b.newVersion}`).join(', ')}`;
  await execFile('git', ['checkout', '-b', branchName]);
  await execFile('git', ['commit', '-m', commitName]);
  await execFile('git', ['push', '--set-upstream', 'origin', branchName]);

  // Compute the list of all impacted changelogs
  const changelogs = allBumps
    .map((b) => b.packageLocation.substring(process.cwd().length + 1).replace(/\\/g, '/'))
    .map(
      (packageRelativePath) =>
        `https://github.com/dubzzz/fast-check/blob/${branchName}/${packageRelativePath}/CHANGELOG.md`,
    );

  // Return useful details
  return { branchName, commitName, errors: allErrors, changelogs };
}

exports.run = run;
