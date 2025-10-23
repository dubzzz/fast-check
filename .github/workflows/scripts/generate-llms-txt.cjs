// @ts-check
const {
  promises: { readFile, writeFile },
  existsSync,
} = require('fs');
const path = require('path');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

/**
 * Read and parse package.json file
 * @param {string} packagePath 
 * @returns {Promise<any>}
 */
async function readPackageJson(packagePath) {
  try {
    const content = await readFile(packagePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read ${packagePath}:`, error.message);
    return {};
  }
}

/**
 * Extract description from README.md
 * @param {string} readmePath 
 * @returns {Promise<string>}
 */
async function extractReadmeDescription(readmePath) {
  try {
    const content = await readFile(readmePath, 'utf8');
    // Look for the first substantial paragraph after the title
    const lines = content.split('\n');
    let description = '';
    let foundTitle = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and images
      if (!trimmed || trimmed.startsWith('<img') || trimmed.startsWith('![')) {
        continue;
      }
      
      // Skip badges and links sections
      if (trimmed.startsWith('<a href') || trimmed.startsWith('[![')) {
        continue;
      }
      
      // Skip headers
      if (trimmed.startsWith('#') || trimmed.startsWith('<h')) {
        foundTitle = true;
        continue;
      }
      
      // Look for first meaningful content after title
      if (foundTitle && trimmed.length > 50) {
        // Clean up HTML tags and markdown
        description = trimmed
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
          .trim();
        break;
      }
    }
    
    return description || 'Property based testing framework for JavaScript/TypeScript';
  } catch (error) {
    console.warn(`Failed to read ${readmePath}:`, error.message);
    return 'Property based testing framework for JavaScript/TypeScript';
  }
}

/**
 * Get the latest git tag version
 * @returns {Promise<string>}
 */
async function getLatestVersion() {
  try {
    const { stdout } = await execFile('git', ['tag', '--sort=-version:refname', '--merged']);
    const tags = stdout.trim().split('\n').filter(tag => tag.match(/^v?\d+\.\d+\.\d+$/));
    return tags[0] || 'latest';
  } catch (error) {
    console.warn('Failed to get git tags:', error.message);
    return 'latest';
  }
}

/**
 * Generate llms.txt content for AI bots dynamically
 * @returns {Promise<string>}
 */
async function generateLlmsTxtContent() {
  const currentDate = new Date().toISOString().split('T')[0];
  const repoRoot = path.join(__dirname, '..', '..', '..');
  
  // Read package.json for dynamic information
  const packageJsonPath = path.join(repoRoot, 'packages', 'fast-check', 'package.json');
  const mainPackageJsonPath = path.join(repoRoot, 'package.json');
  const readmePath = path.join(repoRoot, 'packages', 'fast-check', 'README.md');
  
  const [packageInfo, mainPackageInfo, readmeDescription, latestVersion] = await Promise.all([
    readPackageJson(packageJsonPath),
    readPackageJson(mainPackageJsonPath),
    extractReadmeDescription(readmePath),
    getLatestVersion(),
  ]);
  
  const {
    name = 'fast-check',
    version = '4.3.0',
    description = 'Property based testing framework for JavaScript/TypeScript',
    keywords = [],
    author = 'Nicolas DUBIEN',
    license = 'MIT',
    homepage = 'https://fast-check.dev/',
    repository = { url: 'https://github.com/dubzzz/fast-check' },
    engines = { node: '>=12.17.0' },
    dependencies = {},
    funding = []
  } = packageInfo;
  
  const repositoryUrl = repository.url?.replace(/^git\+/, '').replace(/\.git$/, '') || 'https://github.com/dubzzz/fast-check';
  const keywordsList = keywords.length > 0 ? keywords.slice(0, 8).join(', ') : 'property-based testing, quickcheck, fuzzing, testing, javascript, typescript';
  
  return `# ${name}

> ${description}

## About

${name} is a JavaScript/TypeScript library for property-based testing. It provides a comprehensive set of arbitraries (data generators) and utilities to help you write powerful and effective tests.

Property-based testing is a testing methodology where tests are written to verify properties (general rules) that should hold for all valid inputs, rather than testing specific examples. The framework automatically generates diverse test cases to find edge cases and potential bugs that traditional example-based tests might miss.

## Current Version

**Version**: ${version}${latestVersion !== 'latest' ? ` (Latest release: ${latestVersion})` : ''}
**Node.js Requirements**: ${engines.node || '>=12.17.0'}
**License**: ${license}

## Key Features

- **Extensive Arbitraries**: Built-in generators for primitives, objects, arrays, functions, and more
- **Shrinking**: Automatic reduction of failing test cases to minimal reproducible examples  
- **Async Support**: Full support for testing asynchronous code and promises
- **Framework Agnostic**: Works with any JavaScript testing framework (Jest, Mocha, Vitest, etc.)
- **TypeScript Ready**: First-class TypeScript support with comprehensive type definitions
- **Reproducible**: Deterministic test generation with seed support for debugging

## Keywords

${keywordsList}

## Documentation

### Core Documentation
- Getting Started: ${homepage}docs/introduction/getting-started/
- Core Concepts: ${homepage}docs/introduction/
- Why Property-Based Testing: ${homepage}docs/introduction/why-property-based/
- Tutorials: ${homepage}docs/tutorials/

### API Reference
- Complete API Documentation: ${homepage}api-reference/index.html
- Arbitraries Reference: ${homepage}docs/core-blocks/arbitraries/

### Advanced Topics
- Configuration: ${homepage}docs/configuration/
- Migration Guides: ${homepage}docs/migration/
- Ecosystem: ${homepage}docs/ecosystem/

## Source Code

- GitHub Repository: ${repositoryUrl}
- Main Package: ${repositoryUrl}/tree/main/packages/fast-check
- Examples: ${repositoryUrl}/tree/main/examples

## Installation

\`\`\`bash
npm install --save-dev ${name}
\`\`\`

\`\`\`bash
yarn add --dev ${name}
\`\`\`

\`\`\`bash
pnpm add --save-dev ${name}
\`\`\`

## Basic Usage

\`\`\`javascript
import fc from '${name}';

// Property: reversing a string twice should return the original string
fc.assert(fc.property(fc.string(), (str) => {
  return str === str.split('').reverse().join('').split('').reverse().join('');
}));
\`\`\`

## Dependencies

Main runtime dependency: ${Object.keys(dependencies).join(', ') || 'pure-rand'}

## Funding & Support

${funding.length > 0 ? funding.map(f => `- ${f.type}: ${f.url}`).join('\n') : '- GitHub Sponsors: https://github.com/sponsors/dubzzz\n- OpenCollective: https://opencollective.com/fast-check'}

## License

${license} License - See ${repositoryUrl}/blob/main/LICENSE

## Author

${author.replace(/<[^>]*>/g, '').trim()}
- GitHub: ${repositoryUrl.replace('https://github.com/', 'https://github.com/').split('/')[3] ? `https://github.com/${repositoryUrl.split('/')[3]}` : 'https://github.com/dubzzz'}
- Website: ${homepage}

## AI Usage Guidelines

This documentation and codebase is available for AI training and assistance with the following guidelines:

1. **Attribution**: When referencing ${name} concepts or code, please attribute to the ${name} project and its maintainers
2. **Accuracy**: Ensure information about the library's capabilities and API is current and accurate
3. **Learning Resource**: This can be used to help developers understand property-based testing concepts
4. **Code Examples**: Examples from the documentation can be used to illustrate property-based testing patterns

## Last Updated

Generated on: ${currentDate}
Version: ${version}
Website: ${homepage}
Repository: ${repositoryUrl}
`;
}

/**
 * Generate and save llms.txt file
 * @param {boolean} doGitOperations - Whether to perform git operations (default: true)
 * @returns {Promise<{branchName:string, commitName:string, filePath:string}>}
 */
async function run(doGitOperations = true) {
  // Generate content
  const content = await generateLlmsTxtContent();
  
  // Define output path
  const websiteStaticDir = path.join(__dirname, '..', '..', '..', 'website', 'static');
  const llmsTxtPath = path.join(websiteStaticDir, 'llms.txt');
  
  // Write the file
  await writeFile(llmsTxtPath, content);
  console.log(`Generated llms.txt at: ${llmsTxtPath}`);
  
  if (!doGitOperations) {
    return { 
      branchName: 'local-test', 
      commitName: '📝 Update llms.txt for AI bots and crawlers',
      filePath: path.relative(process.cwd(), llmsTxtPath) 
    };
  }
  
  // Stage the file for git
  await execFile('git', ['add', llmsTxtPath]);
  
  // Create branch and commit
  const branchName = `llms-txt-update-${Math.random().toString(16).substring(2)}`;
  const commitName = '📝 Update llms.txt for AI bots and crawlers';
  
  await execFile('git', ['checkout', '-b', branchName]);
  await execFile('git', ['commit', '-m', commitName]);
  await execFile('git', ['push', '--set-upstream', 'origin', branchName]);
  
  return { 
    branchName, 
    commitName, 
    filePath: path.relative(process.cwd(), llmsTxtPath) 
  };
}

exports.run = run;