// @ts-check
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
 * @returns {Promise<{newFeaturesSection:string[], maintenanceSection:{type:string,pr:string,title:string}[]}>}
 */
async function extractAndParseDiff(fromIdentifier) {
  // Extract raw diff log
  const { stdout: diffOutput } = await execFile('git', ['--no-pager', 'log', `${fromIdentifier}..HEAD`, '--format=%s']);
  const diffOutputLines = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length !== 0);

  // Parse raw diff log
  let newFeaturesSection = [];
  let maintenanceSection = [];
  for (const lineDiff of diffOutputLines) {
    const [type, ...titleAndPR] = lineDiff.split(' ');
    const prExtractor = /^(.*) \(#(\d+)\)$/;
    let title;
    let pr;
    try {
      [, title, pr] = prExtractor.exec(titleAndPR.join(' '));
    } catch (err) {
      console.error(`⚠️⚠️⚠️ Failed to extract PR/title from: ${JSON.stringify(lineDiff)} ⚠️⚠️⚠️`);
      break;
    }
    switch (type) {
      case '⚡️':
      case ':zap:':
      case '✨':
      case ':sparkles:':
        newFeaturesSection.push(buildPrLine(pr, title));
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
        console.error(`⚠️⚠️⚠️ Unhandled type: ${type} ⚠️⚠️⚠️`);
        break;
    }
  }

  return { newFeaturesSection, maintenanceSection };
}

/**
 * @param {{nextVersion:string, shortDescription:string}} configuration
 * @returns {Promise<void>}
 */
async function run({ nextVersion, shortDescription }) {
  // Extract metas for changelog
  const lastTag = await extractLastTag();
  const { newFeaturesSection, maintenanceSection } = await extractAndParseDiff(lastTag);

  // Build changelog message
  const codeUrl = `https://github.com/dubzzz/fast-check/tree/v${nextVersion}`;
  const diffUrl = `https://github.com/dubzzz/fast-check/compare/${lastTag}...v${nextVersion}`;
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
    '## Features\n\n' +
    `${newFeaturesBlock}\n\n` +
    '## Fixes\n\n' +
    `${maintenanceBlock}`;
  console.log(body);
}

exports.run = run;
