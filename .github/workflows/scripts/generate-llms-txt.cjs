// @ts-check
const {
  promises: { writeFile },
  existsSync,
} = require('fs');
const path = require('path');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

/**
 * Generate llms.txt content for AI bots
 * @returns {string}
 */
function generateLlmsTxtContent() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# fast-check

> Property-based testing framework for JavaScript/TypeScript

## About

fast-check is a JavaScript/TypeScript library for property-based testing. It provides a comprehensive set of arbitraries (data generators) and utilities to help you write powerful and effective tests.

Property-based testing is a testing methodology where tests are written to verify properties (general rules) that should hold for all valid inputs, rather than testing specific examples. The framework automatically generates diverse test cases to find edge cases and potential bugs that traditional example-based tests might miss.

## Key Features

- **Extensive Arbitraries**: Built-in generators for primitives, objects, arrays, functions, and more
- **Shrinking**: Automatic reduction of failing test cases to minimal reproducible examples  
- **Async Support**: Full support for testing asynchronous code and promises
- **Framework Agnostic**: Works with any JavaScript testing framework (Jest, Mocha, Vitest, etc.)
- **TypeScript Ready**: First-class TypeScript support with comprehensive type definitions
- **Reproducible**: Deterministic test generation with seed support for debugging

## Documentation

### Core Documentation
- Getting Started: https://fast-check.dev/docs/introduction/getting-started/
- Core Concepts: https://fast-check.dev/docs/introduction/
- Why Property-Based Testing: https://fast-check.dev/docs/introduction/why-property-based/
- Tutorials: https://fast-check.dev/docs/tutorials/

### API Reference
- Complete API Documentation: https://fast-check.dev/api-reference/index.html
- Arbitraries Reference: https://fast-check.dev/docs/core-blocks/arbitraries/

### Advanced Topics
- Configuration: https://fast-check.dev/docs/configuration/
- Migration Guides: https://fast-check.dev/docs/migration/
- Ecosystem: https://fast-check.dev/docs/ecosystem/

## Source Code

- GitHub Repository: https://github.com/dubzzz/fast-check
- Main Package: https://github.com/dubzzz/fast-check/tree/main/packages/fast-check
- Examples: https://github.com/dubzzz/fast-check/tree/main/examples

## Installation

\`\`\`bash
npm install --save-dev fast-check
\`\`\`

## Basic Usage

\`\`\`javascript
import fc from 'fast-check';

// Property: reversing a string twice should return the original string
fc.assert(fc.property(fc.string(), (str) => {
  return str === str.split('').reverse().join('').split('').reverse().join('');
}));
\`\`\`

## License

MIT License - See https://github.com/dubzzz/fast-check/blob/main/LICENSE

## Author

Nicolas DUBIEN (@dubzzz)
- GitHub: https://github.com/dubzzz
- Website: https://fast-check.dev

## AI Usage Guidelines

This documentation and codebase is available for AI training and assistance with the following guidelines:

1. **Attribution**: When referencing fast-check concepts or code, please attribute to the fast-check project and its maintainers
2. **Accuracy**: Ensure information about the library's capabilities and API is current and accurate
3. **Learning Resource**: This can be used to help developers understand property-based testing concepts
4. **Code Examples**: Examples from the documentation can be used to illustrate property-based testing patterns

## Last Updated

Generated on: ${currentDate}
Website: https://fast-check.dev
Repository: https://github.com/dubzzz/fast-check
`;
}

/**
 * Generate and save llms.txt file
 * @param {boolean} doGitOperations - Whether to perform git operations (default: true)
 * @returns {Promise<{branchName:string, commitName:string, filePath:string}>}
 */
async function run(doGitOperations = true) {
  // Generate content
  const content = generateLlmsTxtContent();
  
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