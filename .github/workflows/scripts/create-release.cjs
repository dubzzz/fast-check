// @ts-check
/**
 * Script to extract release information from CHANGELOG.md files
 * 
 * This script is used by the create-release.yml GitHub Action workflow
 * to parse CHANGELOG.md files and extract the latest release notes for
 * creating GitHub releases.
 * 
 * Package naming conventions:
 * - fast-check: Uses tags like v4.5.2
 * - Other packages: Use tags like ava/v2.0.2, jest/v2.1.1, etc.
 * 
 * CHANGELOG format expected:
 * # VERSION
 * _Description_
 * [[Code]...][[Diff]...]
 * ## Features/Fixes/Breaking changes
 * - PR links and descriptions
 */
const {
  promises: { readFile },
} = require('fs');
const path = require('path');

/**
 * Get package directory and metadata based on package name
 * @param {string} packageName - Short package name (e.g., 'fast-check', 'ava', 'jest')
 * @returns {{packageDir: string, fullPackageName: string, tagPrefix: string}}
 */
function getPackageMetadata(packageName) {
  const packageDir = path.join(process.cwd(), 'packages', packageName);
  
  let fullPackageName;
  let tagPrefix;
  
  if (packageName === 'fast-check') {
    fullPackageName = 'fast-check';
    tagPrefix = 'v';
  } else {
    fullPackageName = `@fast-check/${packageName}`;
    tagPrefix = `${packageName}/v`;
  }
  
  return { packageDir, fullPackageName, tagPrefix };
}

/**
 * Extract the latest release notes from CHANGELOG.md
 * @param {string} changelogPath - Path to CHANGELOG.md file
 * @returns {Promise<{version: string, title: string, body: string}>}
 */
async function extractLatestRelease(changelogPath) {
  const content = await readFile(changelogPath, 'utf-8');
  const lines = content.split('\n');
  
  let version = '';
  let title = '';
  const bodyLines = [];
  let inFirstRelease = false;
  let lineIndex = 0;
  
  // Find the first version header (e.g., "# 4.5.2")
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const versionMatch = line.match(/^#\s+(\d+\.\d+\.\d+)/);
    
    if (versionMatch) {
      version = versionMatch[1];
      inFirstRelease = true;
      lineIndex++;
      break;
    }
    lineIndex++;
  }
  
  if (!version) {
    throw new Error('No version found in CHANGELOG.md');
  }
  
  // Extract the title (description line starting with _)
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    if (line.trim().startsWith('_') && line.trim().endsWith('_')) {
      title = line.trim().substring(1, line.trim().length - 1);
      lineIndex++;
      break;
    }
    lineIndex++;
  }
  
  // Extract the body until we hit the next version or separator
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    // Stop at next version header or horizontal rule
    if (line.match(/^#\s+\d+\.\d+\.\d+/) || line.trim() === '---') {
      break;
    }
    
    bodyLines.push(line);
    lineIndex++;
  }
  
  // Clean up body - remove trailing empty lines
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
    bodyLines.pop();
  }
  
  const body = bodyLines.join('\n').trim();
  
  return { version, title, body };
}

/**
 * Main function to create release information
 * @param {string} packageName - Short package name (e.g., 'fast-check', 'ava', 'jest')
 * @returns {Promise<{tag: string, title: string, body: string, error?: string}>}
 */
async function run(packageName) {
  try {
    const { packageDir, fullPackageName, tagPrefix } = getPackageMetadata(packageName);
    const changelogPath = path.join(packageDir, 'CHANGELOG.md');
    
    // Extract latest release from CHANGELOG
    const { version, title, body } = await extractLatestRelease(changelogPath);
    
    // Construct tag name
    const tag = `${tagPrefix}${version}`;
    
    // Construct release title
    const releaseTitle = `${fullPackageName}@${version}`;
    
    // Construct release body (title + body from changelog)
    const releaseBody = title ? `_${title}_\n\n${body}` : body;
    
    return {
      tag,
      title: releaseTitle,
      body: releaseBody
    };
  } catch (error) {
    return {
      tag: '',
      title: '',
      body: '',
      error: error.message
    };
  }
}

module.exports = { run };
